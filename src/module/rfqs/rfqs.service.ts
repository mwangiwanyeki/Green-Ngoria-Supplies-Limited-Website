import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RfqStatus, SystemRole } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
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
import {
  generateRfqNumber,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateRfqDto, RfqItemDto } from './dto/create-rfq.dto';

const STATUS_TRANSITIONS: Record<RfqStatus, RfqStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['RESPONDED', 'CLOSED', 'CANCELLED'],
  RESPONDED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

@Injectable()
export class RfqsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly orgsService: OrganizationsService,
  ) {}

  async create(organizationId: string, dto: CreateRfqDto, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    if (!dto.items?.length) {
      throw new BadRequestException('RFQ must contain at least one line item');
    }

    let rfqNumber = '';
    const rfq = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        rfqNumber = await generateRfqNumber(tx);
        const newRfq = await tx.rfq.create({
          data: {
            organizationId,
            clientId: dto.clientId,
            projectId: dto.projectId,
            rfqNumber,
            title: dto.title,
            description: dto.description,
            deliveryLocation: dto.deliveryLocation,
            requiredByDate: dto.requiredByDate,
            technicalRequirements: dto.technicalRequirements,
            status: 'DRAFT',
            createdById: userId,
          },
        });

        await tx.rfqItem.createMany({
          data: dto.items.map((item) => ({
            rfqId: newRfq.id,
            equipmentId: item.equipmentId,
            lineNumber: item.lineNumber,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit ?? 'EA',
            technicalSpecs: item.technicalSpecs,
            notes: item.notes,
          })),
        });

        return newRfq;
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.RFQ_CREATED,
      entity: 'Rfq',
      entityId: rfq.id,
      newValues: { rfqNumber, title: dto.title },
    });

    return this.findById(organizationId, rfq.id, userId);
  }

  async findAll(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
    status?: RfqStatus,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const { skip, take, orderBy } = buildPagination(pagination);
    const where: Prisma.RfqWhereInput = { organizationId, deletedAt: null };
    if (status) where.status = status;

    if (pagination.search) {
      where.OR = [
        { rfqNumber: { contains: pagination.search, mode: 'insensitive' } },
        { title: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.rfq.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          client: { select: { id: true, companyName: true } },
          _count: { select: { items: true, quotations: true } },
        },
      }),
      this.prisma.rfq.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    const rfq = await this.prisma.rfq.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        items: {
          orderBy: { lineNumber: 'asc' },
          include: {
            equipment: { select: { id: true, name: true, sku: true } },
          },
        },
        attachments: true,
        client: { select: { id: true, companyName: true, clientNumber: true } },
        project: { select: { id: true, projectNumber: true, name: true } },
        quotations: { select: { id: true, quoteNumber: true, status: true } },
      },
    });

    if (!rfq) throw new NotFoundException('RFQ not found');
    return rfq;
  }

  async transition(
    organizationId: string,
    id: string,
    toStatus: RfqStatus,
    userId: string,
  ) {
    const rfq = await this.findById(organizationId, id, userId);
    const current = rfq.status;
    const allowed = STATUS_TRANSITIONS[current] ?? [];

    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(
        `Cannot transition RFQ from ${current} to ${toStatus}. Allowed: ${allowed.join(', ')}`,
      );
    }

    const updates: Prisma.RfqUncheckedUpdateInput = { status: toStatus };
    if (toStatus === 'SUBMITTED') updates.submittedAt = new Date();
    if (toStatus === 'RESPONDED') updates.respondedAt = new Date();

    const updated = await this.prisma.rfq.update({
      where: { id },
      data: updates,
    });

    await this.auditService.log({
      userId,
      organizationId,
      action:
        toStatus === 'SUBMITTED'
          ? AuditAction.RFQ_SUBMITTED
          : AuditAction.RFQ_UPDATED,
      entity: 'Rfq',
      entityId: id,
      oldValues: { status: current },
      newValues: { status: toStatus },
    });

    if (toStatus === 'SUBMITTED') {
      await this.notifyTeam(organizationId, id, rfq.rfqNumber, rfq.title);
    }

    return updated;
  }

  async addItem(
    organizationId: string,
    rfqId: string,
    item: RfqItemDto,
    userId: string,
  ) {
    const rfq = await this.findById(organizationId, rfqId, userId);
    if (rfq.status !== 'DRAFT') {
      throw new BadRequestException('Items can only be added to DRAFT RFQs');
    }
    return this.prisma.rfqItem.create({ data: { rfqId, ...item } });
  }

  async removeItem(
    organizationId: string,
    rfqId: string,
    itemId: string,
    userId: string,
  ) {
    const rfq = await this.findById(organizationId, rfqId, userId);
    if (rfq.status !== 'DRAFT') {
      throw new BadRequestException(
        'Items can only be removed from DRAFT RFQs',
      );
    }
    await this.prisma.rfqItem.delete({ where: { id: itemId } });
    return { message: 'Item removed' };
  }

  private async notifyTeam(
    organizationId: string,
    rfqId: string,
    rfqNumber: string,
    title: string,
  ) {
    const members = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        removedAt: null,
        role: {
          in: [
            SystemRole.SALES_MANAGER,
            SystemRole.CRM_OFFICER,
            SystemRole.ADMIN,
            SystemRole.SUPER_ADMIN,
          ],
        },
      },
      select: { userId: true },
    });

    await this.notificationsService.createBulk(
      members.map((m) => m.userId),
      {
        organizationId,
        type: NotificationType.RFQ_RECEIVED,
        title: 'New RFQ submitted',
        message: `${rfqNumber}: ${title}`,
        entityType: 'Rfq',
        entityId: rfqId,
        actionUrl: `/rfqs/${rfqId}`,
      },
    );
  }
}
