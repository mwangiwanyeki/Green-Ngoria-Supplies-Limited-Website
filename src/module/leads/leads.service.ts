import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { LeadStatus, Prisma } from '@prisma/client';
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
  generateLeadReference,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { CreateConsultationDto } from './dto/create-consultation.dto';

// Valid pipeline transitions
const PIPELINE_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['QUALIFIED', 'LOST', 'INACTIVE'],
  QUALIFIED: ['CONSULTATION', 'LOST', 'INACTIVE'],
  CONSULTATION: ['ASSESSMENT', 'QUALIFIED', 'LOST'],
  ASSESSMENT: ['RFQ', 'CONSULTATION', 'LOST'],
  RFQ: ['QUOTATION', 'ASSESSMENT', 'LOST'],
  QUOTATION: ['NEGOTIATION', 'RFQ', 'LOST'],
  NEGOTIATION: ['WON', 'LOST', 'QUOTATION'],
  WON: [],
  LOST: ['NEW'],
  INACTIVE: ['NEW'],
};

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly orgsService: OrganizationsService,
  ) {}

  async create(
    organizationId: string,
    dto: CreateLeadDto,
    createdById: string,
  ) {
    await this.orgsService.assertMembership(organizationId, createdById);

    const lead = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        const reference = await generateLeadReference(tx);
        return tx.lead.create({
          data: {
            organizationId,
            reference,
            companyName: dto.companyName,
            contactName: dto.contactName,
            contactEmail: dto.contactEmail,
            contactPhone: dto.contactPhone,
            country: dto.country,
            source: dto.source ?? 'WEBSITE',
            status: 'NEW',
            mineralType: dto.mineralType,
            miningLocation: dto.miningLocation,
            projectDescription: dto.projectDescription,
            estimatedValue: dto.estimatedValue,
            currency: dto.currency ?? 'USD',
            priority: dto.priority ?? 'MEDIUM',
            ownerId: dto.ownerId ?? createdById,
            createdById,
          },
        });
      }),
    );

    await this.auditService.log({
      userId: createdById,
      organizationId,
      action: AuditAction.LEAD_CREATED,
      entity: 'Lead',
      entityId: lead.id,
      newValues: { companyName: lead.companyName, reference: lead.reference },
    });

    // Notify assigned owner
    if (dto.ownerId && dto.ownerId !== createdById) {
      await this.notificationsService.create({
        userId: dto.ownerId,
        organizationId,
        type: NotificationType.LEAD_ASSIGNED,
        title: 'New lead assigned',
        message: `Lead from ${dto.companyName} has been assigned to you`,
        entityType: 'Lead',
        entityId: lead.id,
        actionUrl: `/crm/leads/${lead.id}`,
      });
    }

    return lead;
  }

  async findAll(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
    filters?: { status?: LeadStatus; ownerId?: string },
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const { skip, take, orderBy } = buildPagination(pagination);

    const where: Prisma.LeadWhereInput = { organizationId, deletedAt: null };

    if (filters?.status) where.status = filters.status;
    if (filters?.ownerId) where.ownerId = filters.ownerId;

    if (pagination.search) {
      where.OR = [
        { companyName: { contains: pagination.search, mode: 'insensitive' } },
        { contactName: { contains: pagination.search, mode: 'insensitive' } },
        { reference: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          owner: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { activities: true, consultations: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
        consultations: { orderBy: { scheduledAt: 'desc' } },
        assessments: {
          where: { deletedAt: null },
          select: { id: true, reference: true, status: true, createdAt: true },
        },
      },
    });

    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateLeadDto,
    userId: string,
  ) {
    const lead = await this.findById(organizationId, id, userId);

    // Status transition validation
    if (dto.status && dto.status !== lead.status) {
      const allowed = PIPELINE_TRANSITIONS[lead.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from ${lead.status} to ${dto.status}. Allowed: ${allowed.join(', ')}`,
        );
      }
    }

    const updates: Prisma.LeadUncheckedUpdateInput = { ...dto };
    if (dto.status === 'WON') updates.wonAt = new Date();
    if (dto.status === 'LOST') updates.lostAt = new Date();

    const updated = await this.prisma.lead.update({
      where: { id },
      data: updates,
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: dto.status
        ? AuditAction.LEAD_STATUS_CHANGED
        : AuditAction.LEAD_UPDATED,
      entity: 'Lead',
      entityId: id,
      oldValues: { status: lead.status },
      newValues: { status: dto.status, ...dto },
    });

    return updated;
  }

  // ─── Activities ────────────────────────────────────────────────────────────

  async addActivity(
    organizationId: string,
    leadId: string,
    dto: CreateActivityDto,
    userId: string,
  ) {
    await this.findById(organizationId, leadId, userId);

    return this.prisma.crmActivity.create({
      data: {
        leadId,
        type: dto.type,
        subject: dto.subject,
        description: dto.description,
        dueAt: dto.dueAt,
        outcome: dto.outcome,
        createdById: userId,
      },
    });
  }

  async completeActivity(
    organizationId: string,
    leadId: string,
    activityId: string,
    outcome: string,
    userId: string,
  ) {
    await this.findById(organizationId, leadId, userId);

    const activity = await this.prisma.crmActivity.findUnique({
      where: { id: activityId },
      select: { id: true, leadId: true },
    });

    if (!activity || activity.leadId !== leadId) {
      throw new NotFoundException('Activity not found for this lead');
    }

    return this.prisma.crmActivity.update({
      where: { id: activityId },
      data: { completedAt: new Date(), outcome },
    });
  }

  // ─── Consultations ─────────────────────────────────────────────────────────

  async addConsultation(
    organizationId: string,
    leadId: string,
    dto: CreateConsultationDto,
    userId: string,
  ) {
    await this.findById(organizationId, leadId, userId);

    return this.prisma.consultation.create({
      data: {
        leadId,
        scheduledAt: dto.scheduledAt,
        type: dto.type,
        location: dto.location,
        notes: dto.notes,
        outcome: dto.outcome,
        nextSteps: dto.nextSteps,
      },
    });
  }

  async updateConsultation(
    organizationId: string,
    leadId: string,
    consultationId: string,
    dto: import('./dto/update-consultation.dto').UpdateConsultationDto,
    userId: string,
  ) {
    await this.findById(organizationId, leadId, userId);

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      select: { id: true, leadId: true },
    });

    if (!consultation || consultation.leadId !== leadId) {
      throw new (await import('@nestjs/common')).NotFoundException(
        'Consultation not found for this lead',
      );
    }

    return this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        ...(dto.scheduledAt !== undefined && { scheduledAt: dto.scheduledAt }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.outcome !== undefined && { outcome: dto.outcome }),
        ...(dto.nextSteps !== undefined && { nextSteps: dto.nextSteps }),
        ...(dto.markComplete ? { completedAt: new Date() } : {}),
      },
    });
  }

  // ─── Pipeline analytics ────────────────────────────────────────────────────

  async getPipelineSummary(organizationId: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    const statuses = Object.values(LeadStatus);
    const counts = await Promise.all(
      statuses.map((status) =>
        this.prisma.lead.count({
          where: { organizationId, status, deletedAt: null },
        }),
      ),
    );

    const totalValue = await this.prisma.lead.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        status: { notIn: ['LOST', 'INACTIVE'] },
      },
      _sum: { estimatedValue: true },
    });

    return {
      pipeline: Object.fromEntries(statuses.map((s, i) => [s, counts[i]])),
      totalPipelineValue: totalValue._sum.estimatedValue ?? 0,
    };
  }
}
