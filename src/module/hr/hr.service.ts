import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StaffStatus } from '@prisma/client';
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
  generateStaffNumber,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import { startOfToday } from './hr.util';
import { branchScope } from '../../common/utils/branch-scope.util';

/** Statuses that count towards the "in employment" headcount. */
export const EMPLOYED_STATUSES: StaffStatus[] = [
  'ACTIVE',
  'PROBATION',
  'ON_LEAVE',
];

@Injectable()
export class HrService {
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

  // ─── Staff CRUD ────────────────────────────────────────────────────────────

  async createStaff(
    organizationId: string,
    dto: CreateStaffDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, dto.branchId, userId);

    const staff = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        if (dto.userId) {
          const member = await tx.organizationMember.findUnique({
            where: {
              organizationId_userId: { organizationId, userId: dto.userId },
            },
          });
          if (!member || member.removedAt) {
            throw new NotFoundException(
              'User is not a member of this organization',
            );
          }
        }

        const staffNumber = await generateStaffNumber(tx, dto.branchId);
        return tx.staff.create({
          data: {
            organizationId,
            branchId: dto.branchId,
            userId: dto.userId,
            staffNumber,
            firstName: dto.firstName,
            lastName: dto.lastName,
            idNumber: dto.idNumber,
            phone: dto.phone,
            email: dto.email,
            address: dto.address,
            position: dto.position,
            department: dto.department,
            employmentType: dto.employmentType,
            paymentTerms: dto.paymentTerms,
            status: dto.status,
            baseSalary:
              dto.baseSalary === undefined
                ? undefined
                : new Prisma.Decimal(dto.baseSalary),
            currency: dto.currency,
            hireDate: dto.hireDate,
            terminationAt: dto.terminationAt,
            photoUrl: dto.photoUrl,
            notes: dto.notes,
          },
        });
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.STAFF_CREATED,
      entity: 'Staff',
      entityId: staff.id,
      newValues: {
        staffNumber: staff.staffNumber,
        branchId: staff.branchId,
      },
    });
    return staff;
  }

  async findAllStaff(
    organizationId: string,
    userId: string,
    query: QueryStaffDto,
  ) {
    await this.assertScope(organizationId, query.branchId, userId);
    const { skip, take, orderBy } = buildPagination(query, 'firstName');

    const where: Prisma.StaffWhereInput = {
      organizationId,
      branchId: query.branchId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    if (query.employmentType) where.employmentType = query.employmentType;
    if (query.paymentTerms) where.paymentTerms = query.paymentTerms;
    if (query.department) where.department = query.department;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { staffNumber: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { position: { contains: query.search, mode: 'insensitive' } },
        { department: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.staff.findMany({ where, skip, take, orderBy }),
      this.prisma.staff.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  async findStaffById(
    organizationId: string,
    branchId: string,
    id: string,
    userId: string,
  ) {
    await this.assertScope(organizationId, branchId, userId);
    const staff = await this.prisma.staff.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
      include: {
        branch: { select: { id: true, name: true } },
        leaveRequests: {
          where: { deletedAt: null },
          orderBy: { startDate: 'desc' },
          take: 10,
        },
        attendance: { orderBy: { workDate: 'desc' }, take: 10 },
      },
    });
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  async updateStaff(
    organizationId: string,
    branchId: string,
    id: string,
    dto: UpdateStaffDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, branchId, userId);
    const existing = await this.prisma.staff.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
    });
    if (!existing) throw new NotFoundException('Staff member not found');

    if (dto.userId) {
      const member = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: { organizationId, userId: dto.userId },
        },
      });
      if (!member || member.removedAt) {
        throw new NotFoundException(
          'User is not a member of this organization',
        );
      }
    }

    const updated = await this.prisma.staff.update({
      where: { id },
      data: {
        userId: dto.userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        idNumber: dto.idNumber,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        position: dto.position,
        department: dto.department,
        employmentType: dto.employmentType,
        paymentTerms: dto.paymentTerms,
        status: dto.status,
        baseSalary:
          dto.baseSalary === undefined
            ? undefined
            : new Prisma.Decimal(dto.baseSalary),
        currency: dto.currency,
        hireDate: dto.hireDate,
        terminationAt: dto.terminationAt,
        photoUrl: dto.photoUrl,
        notes: dto.notes,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.STAFF_UPDATED,
      entity: 'Staff',
      entityId: id,
      oldValues: { status: existing.status, position: existing.position },
      newValues: { status: updated.status, position: updated.position },
    });
    return updated;
  }

  async removeStaff(
    organizationId: string,
    branchId: string,
    id: string,
    userId: string,
  ) {
    await this.assertScope(organizationId, branchId, userId);
    const staff = await this.prisma.staff.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    await this.prisma.staff.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'TERMINATED' },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.STAFF_DELETED,
      entity: 'Staff',
      entityId: id,
      oldValues: { staffNumber: staff.staffNumber },
    });
    return { id, deleted: true };
  }

  // ─── HR Overview ───────────────────────────────────────────────────────────

  /** Drives the "HR Overview" screen. */
  async getOverview(organizationId: string, branchId: string, userId: string) {
    await this.assertScope(organizationId, branchId, userId);

    const where: Prisma.StaffWhereInput = {
      organizationId,
      branchId,
      deletedAt: null,
    };
    const today = startOfToday();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalStaff,
      headcount,
      byStatus,
      byDepartment,
      byEmploymentType,
      checkedInToday,
      onLeaveNow,
      newThisMonth,
      linkedUsers,
    ] = await Promise.all([
      this.prisma.staff.count({ where }),
      this.prisma.staff.count({
        where: { ...where, status: { in: EMPLOYED_STATUSES } },
      }),
      this.prisma.staff.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.staff.groupBy({
        by: ['department'],
        where,
        _count: { _all: true },
      }),
      this.prisma.staff.groupBy({
        by: ['employmentType'],
        where,
        _count: { _all: true },
      }),
      this.prisma.attendanceRecord.count({
        where: {
          organizationId,
          branchId,
          workDate: today,
          status: { in: ['CHECKED_IN', 'LATE', 'HALF_DAY'] },
        },
      }),
      this.prisma.leaveRequest.count({
        where: {
          organizationId,
          branchId,
          deletedAt: null,
          status: 'APPROVED',
          startDate: { lte: now },
          endDate: { gte: now },
          returnedAt: null,
        },
      }),
      this.prisma.staff.count({
        where: { ...where, createdAt: { gte: monthStart } },
      }),
      this.prisma.staff.count({ where: { ...where, userId: { not: null } } }),
    ]);

    return {
      totalStaff,
      headcount,
      checkedInToday,
      onLeaveNow,
      newThisMonth,
      linkedUsers,
      byStatus: Object.fromEntries(
        byStatus.map((row) => [row.status, row._count._all]),
      ),
      byDepartment: Object.fromEntries(
        byDepartment.map((row) => [
          row.department ?? 'Unassigned',
          row._count._all,
        ]),
      ),
      byEmploymentType: Object.fromEntries(
        byEmploymentType.map((row) => [row.employmentType, row._count._all]),
      ),
    };
  }
}
