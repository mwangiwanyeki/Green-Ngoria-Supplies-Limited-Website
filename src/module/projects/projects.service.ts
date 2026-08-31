import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MilestoneStatus, Prisma, ProjectStatus } from '@prisma/client';
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
  generateProjectNumber,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateRiskDto } from './dto/create-risk.dto';

// Allowed project lifecycle transitions
const STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  AWARDED: ['PLANNING', 'ON_HOLD', 'CANCELLED'],
  PLANNING: ['ENGINEERING', 'ON_HOLD', 'CANCELLED'],
  ENGINEERING: ['PROCUREMENT', 'PLANNING', 'ON_HOLD'],
  PROCUREMENT: ['CONSTRUCTION', 'ENGINEERING', 'ON_HOLD'],
  CONSTRUCTION: ['INSTALLATION', 'PROCUREMENT', 'ON_HOLD'],
  INSTALLATION: ['COMMISSIONING', 'CONSTRUCTION', 'ON_HOLD'],
  COMMISSIONING: ['HANDOVER', 'INSTALLATION', 'ON_HOLD'],
  HANDOVER: ['SUPPORT', 'COMMISSIONING'],
  SUPPORT: ['COMPLETED'],
  COMPLETED: [],
  ON_HOLD: [
    'PLANNING',
    'ENGINEERING',
    'PROCUREMENT',
    'CONSTRUCTION',
    'CANCELLED',
  ],
  CANCELLED: [],
};

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly orgsService: OrganizationsService,
  ) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async create(organizationId: string, dto: CreateProjectDto, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    let projectNumber = '';
    const project = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        projectNumber = await generateProjectNumber(tx);
        return tx.project.create({
          data: {
            organizationId,
            clientId: dto.clientId,
            miningSiteId: dto.miningSiteId,
            projectNumber,
            name: dto.name,
            description: dto.description,
            type: dto.type ?? 'MINERAL_PROCESSING',
            status: 'AWARDED',
            currency: dto.currency ?? 'USD',
            contractValue: dto.contractValue,
            budgetAmount: dto.budgetAmount,
            startDate: dto.startDate,
            targetEndDate: dto.targetEndDate,
            managerId: dto.managerId,
            location: dto.location,
            country: dto.country ?? 'Kenya',
            mineralType: dto.mineralType,
            notes: dto.notes,
          },
        });
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.PROJECT_CREATED,
      entity: 'Project',
      entityId: project.id,
      newValues: { projectNumber, name: dto.name, status: 'AWARDED' },
    });

    // Notify project manager
    if (dto.managerId && dto.managerId !== userId) {
      await this.notificationsService.create({
        userId: dto.managerId,
        organizationId,
        type: NotificationType.PROJECT_STATUS_CHANGED,
        title: 'You have been assigned as Project Manager',
        message: `Project ${projectNumber}: ${dto.name}`,
        entityType: 'Project',
        entityId: project.id,
        actionUrl: `/projects/${project.id}`,
      });
    }

    return project;
  }

  async findAll(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
    filters?: { status?: ProjectStatus },
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const { skip, take, orderBy } = buildPagination(pagination);
    const where: Prisma.ProjectWhereInput = {
      organizationId,
      deletedAt: null,
    };
    if (filters?.status) where.status = filters.status;

    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { projectNumber: { contains: pagination.search, mode: 'insensitive' } },
        { location: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          client: { select: { id: true, companyName: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
          miningSite: { select: { id: true, name: true } },
          _count: { select: { milestones: true, tasks: true, risks: true } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    const project = await this.prisma.project.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        client: { select: { id: true, companyName: true, clientNumber: true } },
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        miningSite: { select: { id: true, name: true, country: true } },
        milestones: { orderBy: { sortOrder: 'asc' } },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        risks: { orderBy: { createdAt: 'desc' } },
        contract: {
          select: { id: true, contractNumber: true, status: true, value: true },
        },
        _count: {
          select: {
            procurement: true,
            siteReports: true,
            hseIncidents: true,
            commissioning: true,
            assets: true,
            documents: true,
          },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(
    organizationId: string,
    id: string,
    dto: Partial<CreateProjectDto>,
    userId: string,
  ) {
    await this.findById(organizationId, id, userId);

    const updated = await this.prisma.project.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.PROJECT_UPDATED,
      entity: 'Project',
      entityId: id,
      newValues: dto,
    });

    return updated;
  }

  // ─── Status transitions ────────────────────────────────────────────────────

  async transition(
    organizationId: string,
    id: string,
    toStatus: ProjectStatus,
    userId: string,
  ) {
    const project = await this.findById(organizationId, id, userId);
    const current = project.status;
    const allowed = STATUS_TRANSITIONS[current] ?? [];

    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(
        `Cannot transition project from ${current} to ${toStatus}. Allowed: ${allowed.join(', ')}`,
      );
    }

    // Commissioning → Handover requires all commissioning tests passed
    if (toStatus === 'HANDOVER') {
      const failedTests = await this.prisma.commissioningTest.count({
        where: {
          system: { projectId: id },
          result: { in: ['FAILED', 'PENDING'] },
        },
      });
      if (failedTests > 0) {
        throw new BadRequestException(
          `Cannot move to HANDOVER: ${failedTests} commissioning test(s) are not yet PASSED`,
        );
      }
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        status: toStatus,
        ...(toStatus === 'COMPLETED' ? { actualEndDate: new Date() } : {}),
      },
    });

    await this.auditService.logStateTransition({
      userId,
      organizationId,
      action: AuditAction.PROJECT_STATUS_CHANGED,
      entity: 'Project',
      entityId: id,
      fromState: current,
      toState: toStatus,
    });

    // Notify project manager
    if (project.managerId) {
      await this.notificationsService.create({
        userId: project.managerId,
        organizationId,
        type: NotificationType.PROJECT_STATUS_CHANGED,
        title: `Project status updated: ${toStatus}`,
        message: `${project.projectNumber}: ${project.name} is now ${toStatus}`,
        entityType: 'Project',
        entityId: id,
        actionUrl: `/projects/${id}`,
      });
    }

    return updated;
  }

  // ─── Milestones ────────────────────────────────────────────────────────────

  async addMilestone(
    organizationId: string,
    projectId: string,
    dto: CreateMilestoneDto,
    userId: string,
  ) {
    await this.findById(organizationId, projectId, userId);

    return this.prisma.projectMilestone.create({
      data: {
        projectId,
        name: dto.name,
        description: dto.description,
        dueDate: dto.dueDate,
        status: 'PENDING',
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async completeMilestone(
    organizationId: string,
    projectId: string,
    milestoneId: string,
    userId: string,
  ) {
    await this.findById(organizationId, projectId, userId);

    const ms = await this.prisma.projectMilestone.findFirst({
      where: { id: milestoneId, projectId },
    });
    if (!ms) throw new NotFoundException('Milestone not found');

    const updated = await this.prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // Notify org team
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { projectNumber: true, name: true, managerId: true },
    });

    if (project?.managerId) {
      await this.notificationsService.create({
        userId: project.managerId,
        organizationId,
        type: NotificationType.PROJECT_MILESTONE_REACHED,
        title: `Milestone completed: ${ms.name}`,
        message: `${project.projectNumber}: ${ms.name} has been marked complete`,
        entityType: 'ProjectMilestone',
        entityId: milestoneId,
        actionUrl: `/projects/${projectId}`,
      });
    }

    return updated;
  }

  async updateMilestone(
    organizationId: string,
    projectId: string,
    milestoneId: string,
    dto: Partial<CreateMilestoneDto> & { status?: MilestoneStatus },
    userId: string,
  ) {
    await this.findById(organizationId, projectId, userId);
    const ms = await this.prisma.projectMilestone.findFirst({
      where: { id: milestoneId, projectId },
    });
    if (!ms) throw new NotFoundException('Milestone not found');
    return this.prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: dto,
    });
  }

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  async addTask(
    organizationId: string,
    projectId: string,
    dto: CreateTaskDto,
    userId: string,
  ) {
    await this.findById(organizationId, projectId, userId);
    return this.prisma.projectTask.create({
      data: { projectId, ...dto, status: 'TODO' },
    });
  }

  async updateTask(
    organizationId: string,
    projectId: string,
    taskId: string,
    dto: Partial<CreateTaskDto> & { status?: string },
    userId: string,
  ) {
    await this.findById(organizationId, projectId, userId);
    const task = await this.prisma.projectTask.findFirst({
      where: { id: taskId, projectId },
    });
    if (!task) throw new NotFoundException('Task not found');

    const updates: Prisma.ProjectTaskUncheckedUpdateInput = { ...dto };
    if (dto.status === 'DONE') updates.completedAt = new Date();

    return this.prisma.projectTask.update({
      where: { id: taskId },
      data: updates,
    });
  }

  // ─── Risks ─────────────────────────────────────────────────────────────────

  async addRisk(
    organizationId: string,
    projectId: string,
    dto: CreateRiskDto,
    userId: string,
  ) {
    await this.findById(organizationId, projectId, userId);
    return this.prisma.projectRisk.create({
      data: { projectId, ...dto, status: 'OPEN' },
    });
  }

  async updateRisk(
    organizationId: string,
    projectId: string,
    riskId: string,
    dto: Partial<CreateRiskDto> & { status?: string },
    userId: string,
  ) {
    await this.findById(organizationId, projectId, userId);
    const risk = await this.prisma.projectRisk.findFirst({
      where: { id: riskId, projectId },
    });
    if (!risk) throw new NotFoundException('Risk not found');
    return this.prisma.projectRisk.update({ where: { id: riskId }, data: dto });
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  async getDashboard(organizationId: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    const statuses = Object.values(ProjectStatus);
    const counts = await Promise.all(
      statuses.map((s) =>
        this.prisma.project.count({
          where: { organizationId, status: s, deletedAt: null },
        }),
      ),
    );

    const totalValue = await this.prisma.project.aggregate({
      where: { organizationId, deletedAt: null },
      _sum: { contractValue: true },
    });

    return {
      byStatus: Object.fromEntries(statuses.map((s, i) => [s, counts[i]])),
      totalContractValue: totalValue._sum.contractValue ?? 0,
    };
  }
}
