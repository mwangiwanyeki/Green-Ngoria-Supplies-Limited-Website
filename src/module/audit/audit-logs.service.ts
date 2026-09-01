import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

const AUDIT_SELECT = {
  id: true,
  action: true,
  entity: true,
  entityId: true,
  oldValues: true,
  newValues: true,
  metadata: true,
  ipAddress: true,
  userAgent: true,
  createdAt: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
  organization: { select: { id: true, name: true } },
} satisfies Prisma.AuditLogSelect;

type AuditRow = Prisma.AuditLogGetPayload<{ select: typeof AUDIT_SELECT }>;

export interface AuditLogView {
  id: string;
  action: string;
  entity: string;
  /** Alias of `entity` — the admin table and the web hook both read this name. */
  entityType: string;
  entityId: string | null;
  actorId: string;
  actorName: string;
  actorEmail: string;
  organizationName: string | null;
  ipAddress: string | null;
  /** Alias of `ipAddress`, kept for the existing activity-log hook. */
  ip: string | null;
  userAgent: string | null;
  details: string | null;
  createdAt: Date;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgsService: OrganizationsService,
  ) {}

  private toView(row: AuditRow): AuditLogView {
    // `newValues` is the most useful single-line summary; fall back to metadata.
    const details = row.newValues ?? row.metadata ?? null;

    return {
      id: row.id,
      action: row.action,
      entity: row.entity,
      entityType: row.entity,
      entityId: row.entityId,
      actorId: row.user.id,
      actorName: `${row.user.firstName} ${row.user.lastName}`.trim(),
      actorEmail: row.user.email,
      organizationName: row.organization?.name ?? null,
      ipAddress: row.ipAddress,
      ip: row.ipAddress,
      userAgent: row.userAgent,
      details,
      createdAt: row.createdAt,
    };
  }

  async findAll(
    organizationId: string,
    userId: string,
    query: QueryAuditLogsDto,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const { skip, take, orderBy } = buildPagination(query);

    const where: Prisma.AuditLogWhereInput = { organizationId };

    if (query.action) where.action = query.action;
    if (query.entity) where.entity = query.entity;
    if (query.entityId) where.entityId = query.entityId;
    if (query.userId) where.userId = query.userId;

    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }

    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: 'insensitive' } },
        { entity: { contains: query.search, mode: 'insensitive' } },
        { entityId: { contains: query.search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy,
        select: AUDIT_SELECT,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toView(row)),
      meta: buildPaginatedMeta(total, query),
    };
  }

  /** Distinct action and entity values present in this org's log, for filters. */
  async getFilterFacets(organizationId: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    const [actions, entities] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { organizationId },
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
      this.prisma.auditLog.findMany({
        where: { organizationId },
        distinct: ['entity'],
        select: { entity: true },
        orderBy: { entity: 'asc' },
      }),
    ]);

    return {
      actions: actions.map((a) => a.action),
      entities: entities.map((e) => e.entity),
    };
  }
}
