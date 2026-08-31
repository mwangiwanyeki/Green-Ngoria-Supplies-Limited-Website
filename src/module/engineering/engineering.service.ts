import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DocumentStatus, DocumentType, Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { StorageService } from '../../lib/storage/storage.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { NotificationsService } from '../../lib/notifications/notifications.service';
import { NotificationType } from '../../lib/notifications/notifications.types';
import { OrganizationsService } from '../organizations/organizations.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import { CreateDocumentDto } from './dto/create-document.dto';

// Valid transitions — engineering documents follow a strict controlled workflow
const STATUS_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  DRAFT: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['REVIEWED', 'DRAFT'],
  REVIEWED: ['APPROVED', 'UNDER_REVIEW'],
  APPROVED: ['SUPERSEDED'],
  SUPERSEDED: ['ARCHIVED'],
  ARCHIVED: [],
};

const APPROVAL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'DIRECTOR',
  'MINING_ENGINEER',
  'PROCESS_ENGINEER',
  'PRODUCTION_MANAGER',
];

@Injectable()
export class EngineeringService {
  private readonly logger = new Logger(EngineeringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly orgsService: OrganizationsService,
  ) {}

  async upload(
    organizationId: string,
    dto: CreateDocumentDto,
    file: Express.Multer.File,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    // Validate file
    this.storageService.validateFile(file);

    // Check for duplicate document number within org
    const existing = await this.prisma.engineeringDocument.findFirst({
      where: {
        organizationId,
        documentNumber: dto.documentNumber,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Document number ${dto.documentNumber} already exists — use the revise endpoint to add a new revision`,
      );
    }

    const storageKey = this.storageService.buildKey(
      organizationId,
      'engineering-documents',
      file.originalname,
    );
    const checksum = this.storageService.computeChecksum(file.buffer);

    // Store file
    await this.storageService.upload(
      file,
      organizationId,
      'engineering-documents',
    );

    const document = await this.prisma.engineeringDocument.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        documentNumber: dto.documentNumber,
        title: dto.title,
        type: dto.type,
        status: 'DRAFT',
        revision: dto.revision ?? 'REV_00',
        description: dto.description,
        tags: dto.tags ?? [],
        storageKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        checksum,
        authorId: userId,
        reviewerId: dto.reviewerId,
        approverId: dto.approverId,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.DOCUMENT_UPLOADED,
      entity: 'EngineeringDocument',
      entityId: document.id,
      newValues: { documentNumber: dto.documentNumber, revision: dto.revision },
    });

    // Notify reviewer if assigned
    if (dto.reviewerId) {
      await this.notificationsService.create({
        userId: dto.reviewerId,
        organizationId,
        type: NotificationType.DOCUMENT_APPROVAL_REQUIRED,
        title: 'Engineering document requires review',
        message: `${dto.documentNumber}: ${dto.title}`,
        entityType: 'EngineeringDocument',
        entityId: document.id,
        actionUrl: `/engineering/documents/${document.id}`,
      });
    }

    return document;
  }

  async findAll(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
    filters?: {
      status?: DocumentStatus;
      projectId?: string;
      type?: DocumentType;
    },
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const { skip, take, orderBy } = buildPagination(pagination);
    const where: Prisma.EngineeringDocumentWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (filters?.status) where.status = filters.status;
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.type) where.type = filters.type;

    if (pagination.search) {
      where.OR = [
        {
          documentNumber: { contains: pagination.search, mode: 'insensitive' },
        },
        { title: { contains: pagination.search, mode: 'insensitive' } },
        { tags: { has: pagination.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.engineeringDocument.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          project: { select: { id: true, projectNumber: true, name: true } },
        },
      }),
      this.prisma.engineeringDocument.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    const doc = await this.prisma.engineeringDocument.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, projectNumber: true, name: true } },
        revisions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async getDownloadUrl(organizationId: string, id: string, userId: string) {
    const doc = await this.findById(organizationId, id, userId);

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.DOCUMENT_DOWNLOADED,
      entity: 'EngineeringDocument',
      entityId: id,
      newValues: { documentNumber: doc.documentNumber },
    });

    const signedUrl = await this.storageService.getSignedUrl(
      doc.storageKey,
      3600,
    );
    return { url: signedUrl, expiresIn: 3600 };
  }

  // ─── Status transitions ────────────────────────────────────────────────────

  async transition(
    organizationId: string,
    id: string,
    toStatus: DocumentStatus,
    userId: string,
    userRoles: string[],
  ) {
    const doc = await this.findById(organizationId, id, userId);
    const current = doc.status;
    const allowed = STATUS_TRANSITIONS[current] ?? [];

    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(
        `Cannot transition document from ${current} to ${toStatus}. Allowed: ${allowed.join(', ')}`,
      );
    }

    // Approval requires authorised role
    if (toStatus === 'APPROVED') {
      const hasRole = userRoles.some((r) => APPROVAL_ROLES.includes(r));
      if (!hasRole) {
        throw new ForbiddenException(
          'Only qualified engineers can approve documents',
        );
      }
    }

    const updateData: Prisma.EngineeringDocumentUncheckedUpdateInput = {
      status: toStatus,
    };

    if (toStatus === 'REVIEWED') updateData.reviewedAt = new Date();
    if (toStatus === 'APPROVED') {
      updateData.approvedAt = new Date();
      updateData.approverId = userId;
    }
    if (toStatus === 'SUPERSEDED') updateData.supersededAt = new Date();

    const updated = await this.prisma.engineeringDocument.update({
      where: { id },
      data: updateData,
    });

    const actionMap: Partial<Record<DocumentStatus, AuditAction>> = {
      REVIEWED: AuditAction.DOCUMENT_REVIEWED,
      APPROVED: AuditAction.DOCUMENT_APPROVED,
      SUPERSEDED: AuditAction.DOCUMENT_SUPERSEDED,
    };

    await this.auditService.log({
      userId,
      organizationId,
      action: actionMap[toStatus] ?? AuditAction.DOCUMENT_REVISED,
      entity: 'EngineeringDocument',
      entityId: id,
      oldValues: { status: current },
      newValues: { status: toStatus },
    });

    if (toStatus === 'APPROVED' && doc.authorId) {
      await this.notificationsService.create({
        userId: doc.authorId,
        organizationId,
        type: NotificationType.DOCUMENT_APPROVED,
        title: 'Document approved',
        message: `${doc.documentNumber}: ${doc.title} has been approved`,
        entityType: 'EngineeringDocument',
        entityId: id,
      });
    }

    return updated;
  }

  // ─── New revision ──────────────────────────────────────────────────────────

  /**
   * Upload a new revision of a controlled document.
   * The previous revision is automatically superseded.
   * Controlled documents are NEVER overwritten — each revision creates a new record.
   */
  async uploadRevision(
    organizationId: string,
    id: string,
    newRevision: string,
    reason: string,
    file: Express.Multer.File,
    userId: string,
  ) {
    const doc = await this.findById(organizationId, id, userId);
    this.storageService.validateFile(file);

    const storageKey = this.storageService.buildKey(
      organizationId,
      'engineering-documents',
      file.originalname,
    );
    const checksum = this.storageService.computeChecksum(file.buffer);

    await this.storageService.upload(
      file,
      organizationId,
      'engineering-documents',
    );

    await this.prisma.$transaction(async (tx) => {
      // Archive the revision history
      await tx.documentRevision.create({
        data: {
          documentId: id,
          revision: doc.revision,
          reason,
          storageKey: doc.storageKey,
          checksum: doc.checksum,
          createdById: userId,
        },
      });

      // Mark old as superseded and update with new file
      await tx.engineeringDocument.update({
        where: { id },
        data: {
          revision: newRevision,
          status: 'DRAFT',
          storageKey,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          checksum,
          reviewedAt: null,
          approvedAt: null,
          supersededAt: null,
        },
      });
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.DOCUMENT_REVISED,
      entity: 'EngineeringDocument',
      entityId: id,
      oldValues: { revision: doc.revision },
      newValues: { revision: newRevision, reason },
    });

    return this.findById(organizationId, id, userId);
  }
}
