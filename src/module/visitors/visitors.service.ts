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
  generateVisitorBadgeNumber,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { RegisterVisitorDto } from './dto/register-visitor.dto';
import { CheckOutVisitorDto } from './dto/check-out-visitor.dto';
import { QueryVisitorsDto } from './dto/query-visitors.dto';

@Injectable()
export class VisitorsService {
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

  async register(
    organizationId: string,
    dto: RegisterVisitorDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, dto.branchId, userId);

    const visitor = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        const badgeNumber = await generateVisitorBadgeNumber(tx, dto.branchId);
        return tx.visitor.create({
          data: {
            organizationId,
            branchId: dto.branchId,
            badgeNumber,
            fullName: dto.fullName,
            idNumber: dto.idNumber,
            phone: dto.phone,
            email: dto.email,
            company: dto.company,
            purpose: dto.purpose,
            hostName: dto.hostName,
            vehiclePlate: dto.vehiclePlate,
            notes: dto.notes,
            checkInAt: dto.checkInAt ?? new Date(),
            registeredById: userId,
          },
        });
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.VISITOR_REGISTERED,
      entity: 'Visitor',
      entityId: visitor.id,
      newValues: {
        badgeNumber: visitor.badgeNumber,
        branchId: visitor.branchId,
        fullName: visitor.fullName,
      },
    });
    return visitor;
  }

  async findAll(
    organizationId: string,
    userId: string,
    query: QueryVisitorsDto,
  ) {
    await this.assertScope(organizationId, query.branchId, userId);
    const { skip, take, orderBy } = buildPagination(query, 'checkInAt');

    const where: Prisma.VisitorWhereInput = {
      organizationId,
      branchId: query.branchId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.checkInAt = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { badgeNumber: { contains: query.search, mode: 'insensitive' } },
        { idNumber: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
        { hostName: { contains: query.search, mode: 'insensitive' } },
        { vehiclePlate: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.visitor.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          registeredBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.visitor.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  async findById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);
    const visitor = await this.prisma.visitor.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        branch: { select: { id: true, name: true } },
        registeredBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    if (!visitor) throw new NotFoundException('Visitor not found');
    return visitor;
  }

  async checkOut(
    organizationId: string,
    id: string,
    dto: CheckOutVisitorDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const visitor = await this.prisma.visitor.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!visitor) throw new NotFoundException('Visitor not found');
    if (visitor.status === 'CHECKED_OUT') {
      return visitor;
    }

    const updated = await this.prisma.visitor.update({
      where: { id },
      data: {
        status: 'CHECKED_OUT',
        checkOutAt: dto.checkOutAt ?? new Date(),
        notes: dto.notes ?? visitor.notes,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.VISITOR_CHECKED_OUT,
      entity: 'Visitor',
      entityId: id,
      oldValues: { status: visitor.status },
      newValues: {
        status: updated.status,
        checkOutAt: updated.checkOutAt?.toISOString(),
      },
    });
    return updated;
  }

  async remove(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);
    const visitor = await this.prisma.visitor.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!visitor) throw new NotFoundException('Visitor not found');

    await this.prisma.visitor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.VISITOR_DELETED,
      entity: 'Visitor',
      entityId: id,
      oldValues: { badgeNumber: visitor.badgeNumber },
    });
    return { id, deleted: true };
  }

  async getStats(organizationId: string, branchId: string, userId: string) {
    await this.assertScope(organizationId, branchId, userId);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [checkedInNow, todaysVisitors] = await Promise.all([
      this.prisma.visitor.count({
        where: {
          organizationId,
          branchId,
          deletedAt: null,
          status: 'CHECKED_IN',
        },
      }),
      this.prisma.visitor.count({
        where: {
          organizationId,
          branchId,
          deletedAt: null,
          checkInAt: { gte: startOfDay, lt: endOfDay },
        },
      }),
    ]);

    return { checkedInNow, todaysVisitors };
  }
}
