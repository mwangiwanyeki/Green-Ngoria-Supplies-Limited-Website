import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SystemRole } from '@prisma/client';
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
import { CreateHseIncidentDto } from './dto/create-hse-incident.dto';

@Injectable()
export class HseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly orgsService: OrganizationsService,
  ) {}

  async createIncident(
    organizationId: string,
    dto: CreateHseIncidentDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const incident = await this.prisma.hseIncident.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        incidentDate: dto.incidentDate,
        location: dto.location,
        severity: dto.severity,
        injuredParty: dto.injuredParty,
        rootCause: dto.rootCause,
        immediateAction: dto.immediateAction,
        correctiveAction: dto.correctiveAction,
        isReportable: dto.isReportable ?? false,
        photos: [],
        createdById: userId,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.HSE_INCIDENT_CREATED,
      entity: 'HseIncident',
      entityId: incident.id,
      newValues: { title: dto.title, severity: dto.severity },
    });

    // Notify HSE officers and managers
    const members = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        removedAt: null,
        role: {
          in: [
            SystemRole.HSE_OFFICER,
            SystemRole.PRODUCTION_MANAGER,
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
        type: NotificationType.HSE_INCIDENT_CREATED,
        title: `HSE Incident: ${dto.severity} — ${dto.title}`,
        message: `Incident reported on ${new Date(dto.incidentDate).toDateString()}`,
        entityType: 'HseIncident',
        entityId: incident.id,
        actionUrl: `/admin/hse/incidents/${incident.id}`,
      },
    );

    return incident;
  }

  async findAllIncidents(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
    projectId?: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const { skip, take, orderBy } = buildPagination(pagination);
    const where: Prisma.HseIncidentWhereInput = { organizationId };
    if (projectId) where.projectId = projectId;
    const [items, total] = await Promise.all([
      this.prisma.hseIncident.findMany({ where, skip, take, orderBy }),
      this.prisma.hseIncident.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findIncidentById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);
    const incident = await this.prisma.hseIncident.findFirst({
      where: { id, organizationId },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async closeIncident(organizationId: string, id: string, userId: string) {
    await this.findIncidentById(organizationId, id, userId);
    return this.prisma.hseIncident.update({
      where: { id },
      data: { closedAt: new Date() },
    });
  }

  async getDashboard(organizationId: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);
    const [total, open, bySeverity] = await Promise.all([
      this.prisma.hseIncident.count({ where: { organizationId } }),
      this.prisma.hseIncident.count({
        where: { organizationId, closedAt: null },
      }),
      this.prisma.hseIncident.groupBy({
        by: ['severity'],
        where: { organizationId },
        _count: { _all: true },
      }),
    ]);
    return {
      total,
      open,
      closed: total - open,
      bySeverity: Object.fromEntries(
        bySeverity.map((s) => [s.severity, s._count._all]),
      ),
    };
  }
}
