import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  // ─── Payroll runs ──────────────────────────────────────────────────────────

  async findPayrollRuns(
    organizationId: string,
    userId: string,
    query: import('./dto/query-payroll-runs.dto').QueryPayrollRunsDto,
  ) {
    await this.assertScope(organizationId, query.branchId, userId);
    const { skip, take, orderBy } = buildPagination(query, 'createdAt');

    const where: Prisma.PayrollRunWhereInput = {
      organizationId,
      branchId: query.branchId,
    };
    if (query.status) where.status = query.status;
    if (query.periodMonth) where.periodMonth = query.periodMonth;
    if (query.periodYear) where.periodYear = query.periodYear;

    const [items, total] = await Promise.all([
      this.prisma.payrollRun.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { _count: { select: { entries: true } } },
      }),
      this.prisma.payrollRun.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  /**
   * Draft a payroll run for a given month/year on a branch. Aggregates every
   * ACTIVE staff member's baseSalary into `totalGross` (the seed — HR then
   * edits per-employee entries for allowances / deductions before approval).
   * A unique (org, branch, month, year) index prevents duplicates.
   */
  async createPayrollRun(
    organizationId: string,
    dto: import('./dto/create-payroll-run.dto').CreatePayrollRunDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, dto.branchId, userId);

    const existing = await this.prisma.payrollRun.findFirst({
      where: {
        organizationId,
        branchId: dto.branchId,
        periodMonth: dto.periodMonth,
        periodYear: dto.periodYear,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(
        'A payroll run already exists for that month.',
      );
    }

    const activeStaff = await this.prisma.staff.findMany({
      where: {
        ...branchScope(organizationId, dto.branchId),
        status: 'ACTIVE',
      },
      select: { id: true, baseSalary: true },
    });

    const totalGross = activeStaff.reduce(
      (sum, s) => sum.plus(s.baseSalary ?? 0),
      new Prisma.Decimal(0),
    );

    const reference = `PR-${dto.periodYear}-${String(dto.periodMonth).padStart(2, '0')}-${dto.branchId.slice(0, 8).toUpperCase()}`;

    return this.prisma.payrollRun.create({
      data: {
        organizationId,
        branchId: dto.branchId,
        reference,
        periodMonth: dto.periodMonth,
        periodYear: dto.periodYear,
        status: 'DRAFT',
        totalGross,
        totalDeductions: new Prisma.Decimal(0),
        totalNet: totalGross,
        staffCount: activeStaff.length,
        currency: dto.currency ?? 'KES',
        notes: dto.notes,
        processedById: userId,
      },
      include: { _count: { select: { entries: true } } },
    });
  }

  // ─── Leave requests ────────────────────────────────────────────────────────

  async createLeaveRequest(
    organizationId: string,
    dto: import('./dto/create-leave-request.dto').CreateLeaveRequestDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, dto.branchId, userId);

    const staff = await this.prisma.staff.findFirst({
      where: { id: dto.staffId, ...branchScope(organizationId, dto.branchId) },
      select: { id: true },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    const diffMs =
      new Date(dto.endDate).getTime() - new Date(dto.startDate).getTime();
    const calendarDays =
      dto.days ?? Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)) + 1);

    return this.prisma.leaveRequest.create({
      data: {
        organizationId,
        branchId: dto.branchId,
        staffId: dto.staffId,
        type: dto.type ?? 'ANNUAL',
        startDate: dto.startDate,
        endDate: dto.endDate,
        days: calendarDays,
        reason: dto.reason,
        status: 'PENDING',
      },
    });
  }

  async findLeaveRequests(
    organizationId: string,
    userId: string,
    query: import('./dto/query-leave-requests.dto').QueryLeaveRequestsDto,
  ) {
    await this.assertScope(organizationId, query.branchId, userId);
    const { skip, take, orderBy } = buildPagination(query, 'startDate');

    const now = new Date();
    const where: Prisma.LeaveRequestWhereInput = {
      organizationId,
      branchId: query.branchId,
      deletedAt: null,
    };
    if (query.status && !query.overdue) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.staffId) where.staffId = query.staffId;
    if (query.from || query.to) {
      where.startDate = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }
    if (query.overdue) {
      where.status = 'APPROVED';
      where.endDate = { lt: now };
      where.returnedAt = null;
    }

    const [items, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          staff: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  async reviewLeaveRequest(
    organizationId: string,
    id: string,
    status: 'APPROVED' | 'DENIED',
    reviewerId: string,
    comments?: string,
  ) {
    await this.orgsService.assertMembership(organizationId, reviewerId);
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!request) throw new NotFoundException('Leave request not found');

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: comments,
      },
    });
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
