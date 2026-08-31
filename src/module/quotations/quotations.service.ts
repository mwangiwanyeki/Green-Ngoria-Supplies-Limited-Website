import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma, QuotationStatus } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { NotificationsService } from '../../lib/notifications/notifications.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { QUEUE_NAMES, PDF_JOBS } from '../../lib/queue/queue.constants';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import {
  generateQuoteNumber,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import {
  CreateQuotationDto,
  QuotationLineItemDto,
} from './dto/create-quotation.dto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';

const STATUS_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: ['INTERNAL_REVIEW', 'EXPIRED'],
  INTERNAL_REVIEW: ['APPROVED', 'DRAFT'],
  APPROVED: ['SENT', 'DRAFT'],
  SENT: ['VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
  VIEWED: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
  ACCEPTED: ['CONVERTED'],
  REJECTED: ['DRAFT'],
  EXPIRED: ['DRAFT'],
  CONVERTED: [],
};

// Roles allowed to approve a quotation
const APPROVAL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'DIRECTOR',
  'SALES_MANAGER',
  'PRODUCTION_MANAGER',
];

@Injectable()
export class QuotationsService {
  private readonly logger = new Logger(QuotationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly orgsService: OrganizationsService,
    @Optional()
    @InjectQueue(QUEUE_NAMES.PDF)
    private readonly pdfQueue: Queue | null,
  ) {}

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(
    organizationId: string,
    dto: CreateQuotationDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    if (!dto.lineItems?.length) {
      throw new BadRequestException(
        'Quotation must contain at least one line item',
      );
    }

    const { subtotal, taxAmount, totalAmount } = this.calculateTotals(
      dto.lineItems,
      dto.taxRate ?? 16,
      dto.discountAmount ?? 0,
    );

    let quoteNumber = '';
    const quotation = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        quoteNumber = await generateQuoteNumber(tx);
        const q = await tx.quotation.create({
          data: {
            organizationId,
            clientId: dto.clientId,
            projectId: dto.projectId,
            rfqId: dto.rfqId,
            quoteNumber,
            revision: 0,
            title: dto.title,
            description: dto.description,
            currency: dto.currency ?? 'USD',
            subtotal,
            taxRate: dto.taxRate ?? 16,
            taxAmount,
            discountAmount: dto.discountAmount ?? 0,
            totalAmount,
            deliveryTerms: dto.deliveryTerms,
            paymentTerms: dto.paymentTerms,
            warrantyTerms: dto.warrantyTerms,
            technicalNotes: dto.technicalNotes,
            commercialNotes: dto.commercialNotes,
            validUntil: dto.validUntil,
            status: 'DRAFT',
            createdById: userId,
          },
        });

        await tx.quotationItem.createMany({
          data: dto.lineItems.map((item) => {
            const discountFactor = new Prisma.Decimal(1).minus(
              new Prisma.Decimal(item.discountPct ?? 0).div(100),
            );
            const lineTotal = new Prisma.Decimal(item.quantity)
              .times(item.unitPrice)
              .times(discountFactor);
            return {
              quotationId: q.id,
              lineNumber: item.lineNumber,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit ?? 'EA',
              unitPrice: item.unitPrice,
              discountPct: item.discountPct ?? 0,
              lineTotal,
              specifications: item.specifications,
              leadTimeDays: item.leadTimeDays,
              notes: item.notes,
            };
          }),
        });

        return q;
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.QUOTATION_CREATED,
      entity: 'Quotation',
      entityId: quotation.id,
      newValues: { quoteNumber, totalAmount: totalAmount.toString() },
    });

    return this.findById(organizationId, quotation.id, userId);
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  async findAll(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
    status?: QuotationStatus,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const { skip, take, orderBy } = buildPagination(pagination);
    const where: Prisma.QuotationWhereInput = {
      organizationId,
      deletedAt: null,
    };
    if (status) where.status = status;

    if (pagination.search) {
      where.OR = [
        { quoteNumber: { contains: pagination.search, mode: 'insensitive' } },
        { title: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          client: { select: { id: true, companyName: true } },
          _count: { select: { lineItems: true } },
        },
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    const quotation = await this.prisma.quotation.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        lineItems: { orderBy: { lineNumber: 'asc' } },
        revisions: { orderBy: { revision: 'desc' }, take: 5 },
        client: { select: { id: true, companyName: true, clientNumber: true } },
        project: { select: { id: true, projectNumber: true, name: true } },
        rfq: { select: { id: true, rfqNumber: true, title: true } },
      },
    });

    if (!quotation) throw new NotFoundException('Quotation not found');
    return quotation;
  }

  // ─── Status transitions ────────────────────────────────────────────────────

  async submitForReview(organizationId: string, id: string, userId: string) {
    const q = await this.findById(organizationId, id, userId);
    return this.transition(organizationId, id, 'INTERNAL_REVIEW', userId, q);
  }

  async approve(
    organizationId: string,
    id: string,
    userId: string,
    userRoles: string[],
  ) {
    const hasRole = userRoles.some((r) => APPROVAL_ROLES.includes(r));
    if (!hasRole) {
      throw new ForbiddenException(
        'Only authorised approvers can approve quotations',
      );
    }

    const q = await this.findById(organizationId, id, userId);

    if (q.status !== 'INTERNAL_REVIEW') {
      throw new BadRequestException(
        'Only INTERNAL_REVIEW quotations can be approved',
      );
    }

    if (!q.lineItems.length) {
      throw new BadRequestException(
        'Cannot approve a quotation with no line items',
      );
    }

    if (!q.validUntil) {
      throw new BadRequestException(
        'Validity date is required before approval',
      );
    }

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.QUOTATION_APPROVED,
      entity: 'Quotation',
      entityId: id,
      newValues: { approvedById: userId },
    });

    // Enqueue PDF generation if Redis is available
    if (this.pdfQueue) {
      await this.pdfQueue
        .add(
          PDF_JOBS.GENERATE_QUOTATION,
          { quotationId: id, organizationId },
          { jobId: `pdf-quote-${id}` },
        )
        .catch((error: unknown) =>
          this.logger.warn(
            `PDF queue unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
          ),
        );
    }

    return updated;
  }

  async send(organizationId: string, id: string, userId: string) {
    const q = await this.findById(organizationId, id, userId);

    if (q.status !== 'APPROVED') {
      throw new BadRequestException(
        'Only APPROVED quotations can be sent to clients',
      );
    }

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.QUOTATION_SENT,
      entity: 'Quotation',
      entityId: id,
      newValues: { sentAt: new Date().toISOString() },
    });

    // Notify client (would look up client user in production)
    this.logger.log(`Quotation ${q.quoteNumber} sent to client`);

    return updated;
  }

  async reject(
    organizationId: string,
    id: string,
    reason: string,
    userId: string,
  ) {
    await this.findById(organizationId, id, userId);

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.QUOTATION_REJECTED,
      entity: 'Quotation',
      entityId: id,
      newValues: { reason },
    });

    return updated;
  }

  // ─── Revision ──────────────────────────────────────────────────────────────

  async createRevision(
    organizationId: string,
    id: string,
    reason: string,
    userId: string,
  ) {
    const q = await this.findById(organizationId, id, userId);

    // Snapshot the current state
    const snapshot: Prisma.InputJsonObject = {
      quoteNumber: q.quoteNumber,
      revision: q.revision,
      status: q.status,
      totalAmount: q.totalAmount.toString(),
      lineItems: q.lineItems.map((item) => ({
        lineNumber: item.lineNumber,
        description: item.description,
        quantity: item.quantity.toString(),
        unit: item.unit,
        unitPrice: item.unitPrice.toString(),
        discountPct: item.discountPct.toString(),
        lineTotal: item.lineTotal.toString(),
        specifications: item.specifications,
        leadTimeDays: item.leadTimeDays,
        notes: item.notes,
      })),
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.quotationRevision.create({
        data: {
          quotationId: id,
          revision: q.revision,
          reason,
          snapshot,
          createdById: userId,
        },
      });

      await tx.quotation.update({
        where: { id },
        data: { revision: q.revision + 1, status: 'DRAFT' },
      });
    });

    return this.findById(organizationId, id, userId);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private calculateTotals(
    items: QuotationLineItemDto[],
    taxRate: number,
    discountAmount: number,
  ) {
    const subtotal = items.reduce((sum, item) => {
      const discountFactor = new Prisma.Decimal(1).minus(
        new Prisma.Decimal(item.discountPct ?? 0).div(100),
      );
      const lineTotal = new Prisma.Decimal(item.quantity)
        .times(item.unitPrice)
        .times(discountFactor);
      return sum.plus(lineTotal);
    }, new Prisma.Decimal(0));

    const afterDiscount = subtotal.minus(discountAmount);
    const taxAmount = afterDiscount.times(taxRate).div(100);
    const totalAmount = afterDiscount.plus(taxAmount);

    return {
      subtotal: subtotal.toDecimalPlaces(2),
      taxAmount: taxAmount.toDecimalPlaces(2),
      totalAmount: totalAmount.toDecimalPlaces(2),
    };
  }

  private async transition(
    organizationId: string,
    id: string,
    toStatus: QuotationStatus,
    userId: string,
    q: { status: QuotationStatus },
  ) {
    const current = q.status;
    const allowed = STATUS_TRANSITIONS[current] ?? [];

    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${toStatus}. Allowed: ${allowed.join(', ')}`,
      );
    }

    return this.prisma.quotation.update({
      where: { id },
      data: { status: toStatus },
    });
  }
}
