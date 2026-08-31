import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { OrganizationsService } from '../organizations/organizations.service';
import { BranchesService } from '../branches/branches.service';
import {
  buildPaginatedMeta,
  buildPagination,
} from '../../common/utils/pagination.util';
import {
  generateSecurityLogReference,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateSecurityLogDto } from './dto/create-security-log.dto';
import { UpdateSecurityLogDto } from './dto/update-security-log.dto';
import { ResolveSecurityLogDto } from './dto/resolve-security-log.dto';
import { QuerySecurityLogsDto } from './dto/query-security-logs.dto';

@Injectable()
export class SiteSecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
    private readonly branches: BranchesService,
  ) {}

  private async assertScope(
    organizationId: string,
    branchId: string,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    await this.branches.assertBranchInOrganization(organizationId, branchId);
  }

  async create(
    organizationId: string,
    dto: CreateSecurityLogDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, dto.branchId, userId);

    const log = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        if (dto.miningSiteId) {
          const site = await tx.miningSite.findFirst({
            where: { id: dto.miningSiteId },
            select: { id: true },
          });
          if (!site) throw new NotFoundException('Mining site not found');
        }

        const reference = await generateSecurityLogReference(tx, dto.branchId);
        return tx.securityLog.create({
          data: {
            organizationId,
            branchId: dto.branchId,
            miningSiteId: dto.miningSiteId,
            reference,
            type: dto.type,
            severity: dto.severity,
            status: dto.status,
            title: dto.title,
            description: dto.description,
            location: dto.location,
            guardName: dto.guardName,
            shift: dto.shift,
            occurredAt: dto.occurredAt ?? new Date(),
            reportedById: userId,
          },
        });
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.SECURITY_LOG_CREATED,
      entity: 'SecurityLog',
      entityId: log.id,
      newValues: {
        reference: log.reference,
        severity: log.severity,
        branchId: log.branchId,
      },
    });
    return log;
  }

  async findAll(
    organizationId: string,
    userId: string,
    query: QuerySecurityLogsDto,
  ) {
    await this.assertScope(organizationId, query.branchId, userId);
    const { skip, take, orderBy } = buildPagination(query, 'occurredAt');

    const where: Prisma.SecurityLogWhereInput = {
      organizationId,
      branchId: query.branchId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.type) where.type = query.type;
    if (query.miningSiteId) where.miningSiteId = query.miningSiteId;
    if (query.from || query.to) {
      where.occurredAt = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }
    if (query.search) {
      where.OR = [
        { reference: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { guardName: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.securityLog.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { miningSite: { select: { id: true, name: true } } },
      }),
      this.prisma.securityLog.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  async findById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);
    const log = await this.prisma.securityLog.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        miningSite: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!log) throw new NotFoundException('Security log not found');
    return log;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateSecurityLogDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const existing = await this.prisma.securityLog.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Security log not found');

    if (dto.miningSiteId) {
      const site = await this.prisma.miningSite.findFirst({
        where: { id: dto.miningSiteId },
        select: { id: true },
      });
      if (!site) throw new NotFoundException('Mining site not found');
    }

    const updated = await this.prisma.securityLog.update({
      where: { id },
      data: {
        miningSiteId: dto.miningSiteId,
        type: dto.type,
        severity: dto.severity,
        status: dto.status,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        guardName: dto.guardName,
        shift: dto.shift,
        occurredAt: dto.occurredAt,
        resolution: dto.resolution,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.SECURITY_LOG_UPDATED,
      entity: 'SecurityLog',
      entityId: id,
      oldValues: { status: existing.status, severity: existing.severity },
      newValues: { status: updated.status, severity: updated.severity },
    });
    return updated;
  }

  async resolve(
    organizationId: string,
    id: string,
    dto: ResolveSecurityLogDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const existing = await this.prisma.securityLog.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Security log not found');

    const updated = await this.prisma.securityLog.update({
      where: { id },
      data: {
        status: dto.status ?? 'RESOLVED',
        resolution: dto.resolution,
        resolvedAt: new Date(),
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.SECURITY_LOG_RESOLVED,
      entity: 'SecurityLog',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status: updated.status },
    });
    return updated;
  }

  async remove(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);
    const log = await this.prisma.securityLog.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!log) throw new NotFoundException('Security log not found');

    await this.prisma.securityLog.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.SECURITY_LOG_DELETED,
      entity: 'SecurityLog',
      entityId: id,
      oldValues: { reference: log.reference },
    });
    return { id, deleted: true };
  }

  async getStats(organizationId: string, branchId: string, userId: string) {
    await this.assertScope(organizationId, branchId, userId);

    const where: Prisma.SecurityLogWhereInput = {
      organizationId,
      branchId,
      deletedAt: null,
    };
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [total, bySeverity, byStatus, byType, openCount, today] =
      await Promise.all([
        this.prisma.securityLog.count({ where }),
        this.prisma.securityLog.groupBy({
          by: ['severity'],
          where,
          _count: { _all: true },
        }),
        this.prisma.securityLog.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        }),
        this.prisma.securityLog.groupBy({
          by: ['type'],
          where,
          _count: { _all: true },
        }),
        this.prisma.securityLog.count({
          where: { ...where, status: { in: ['OPEN', 'INVESTIGATING', 'ESCALATED'] } },
        }),
        this.prisma.securityLog.count({
          where: { ...where, occurredAt: { gte: startOfDay } },
        }),
      ]);

    return {
      total,
      open: openCount,
      resolved: total - openCount,
      today,
      bySeverity: Object.fromEntries(
        bySeverity.map((row) => [row.severity, row._count._all]),
      ),
      byStatus: Object.fromEntries(
        byStatus.map((row) => [row.status, row._count._all]),
      ),
      byType: Object.fromEntries(
        byType.map((row) => [row.type, row._count._all]),
      ),
    };
  }
}
