import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VatLeachRentalStatus } from '@prisma/client';
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
  generateVatLeachRentalReference,
  generateVatLeachUnitCode,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateVatLeachUnitDto } from './dto/create-vat-leach-unit.dto';
import { UpdateVatLeachUnitDto } from './dto/update-vat-leach-unit.dto';
import { QueryVatLeachUnitsDto } from './dto/query-vat-leach-units.dto';
import { CreateVatLeachRentalDto } from './dto/create-vat-leach-rental.dto';
import { UpdateVatLeachRentalDto } from './dto/update-vat-leach-rental.dto';
import { QueryVatLeachRentalsDto } from './dto/query-vat-leach-rentals.dto';
import { RecordVatLeachPaymentDto } from './dto/record-vat-leach-payment.dto';
import { QueryVatLeachPaymentsDto } from './dto/query-vat-leach-payments.dto';
import { QueryPaymentRemindersDto } from './dto/query-payment-reminders.dto';
import { branchScope } from '../../common/utils/branch-scope.util';

/** Default billing cycle for a vat leach rental, in days. */
const BILLING_CYCLE_DAYS = 30;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

@Injectable()
export class VatLeachService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
    private readonly branches: BranchesService,
  ) {}

  /**
   * Membership + branch-ownership check. Every caller-supplied `branchId`
   * passes through `BranchesService.assertBranchInOrganization` so a member of
   * one tenant can never point at another tenant's branch.
   */
  private async assertScope(
    organizationId: string,
    branchId: string,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    await this.branches.assertBranchInOrganization(organizationId, branchId);
  }

  // ─── Units ─────────────────────────────────────────────────────────────────

  async createUnit(
    organizationId: string,
    dto: CreateVatLeachUnitDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, dto.branchId, userId);

    const unit = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        const code =
          dto.code ?? (await generateVatLeachUnitCode(tx, dto.branchId));
        return tx.vatLeachUnit.create({
          data: {
            organizationId,
            branchId: dto.branchId,
            miningSiteId: dto.miningSiteId,
            code,
            name: dto.name,
            location: dto.location,
            capacityTonnes:
              dto.capacityTonnes === undefined
                ? undefined
                : new Prisma.Decimal(dto.capacityTonnes),
            status: dto.status,
            notes: dto.notes,
          },
        });
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.VAT_LEACH_UNIT_CREATED,
      entity: 'VatLeachUnit',
      entityId: unit.id,
      newValues: { code: unit.code, branchId: unit.branchId },
    });
    return unit;
  }

  async findAllUnits(
    organizationId: string,
    userId: string,
    query: QueryVatLeachUnitsDto,
  ) {
    await this.assertScope(organizationId, query.branchId, userId);
    const { skip, take, orderBy } = buildPagination(query, 'code');

    const where: Prisma.VatLeachUnitWhereInput = {
      organizationId,
      branchId: query.branchId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    if (query.miningSiteId) where.miningSiteId = query.miningSiteId;
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.vatLeachUnit.findMany({ where, skip, take, orderBy }),
      this.prisma.vatLeachUnit.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  /** Units that can be assigned to a new rental right now. */
  async findAvailableUnits(
    organizationId: string,
    branchId: string,
    userId: string,
  ) {
    await this.assertScope(organizationId, branchId, userId);
    return this.prisma.vatLeachUnit.findMany({
      where: {
        organizationId,
        branchId,
        deletedAt: null,
        status: 'AVAILABLE',
      },
      orderBy: { code: 'asc' },
    });
  }

  async findUnitById(
    organizationId: string,
    branchId: string,
    id: string,
    userId: string,
  ) {
    await this.assertScope(organizationId, branchId, userId);
    const unit = await this.prisma.vatLeachUnit.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
      include: {
        rentals: {
          where: { deletedAt: null },
          orderBy: { startDate: 'desc' },
          take: 10,
        },
      },
    });
    if (!unit) throw new NotFoundException('Vat leach unit not found');
    return unit;
  }

  async updateUnit(
    organizationId: string,
    branchId: string,
    id: string,
    dto: UpdateVatLeachUnitDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, branchId, userId);
    const existing = await this.prisma.vatLeachUnit.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
    });
    if (!existing) throw new NotFoundException('Vat leach unit not found');

    const updated = await this.prisma.vatLeachUnit.update({
      where: { id },
      data: {
        miningSiteId: dto.miningSiteId,
        code: dto.code,
        name: dto.name,
        location: dto.location,
        capacityTonnes:
          dto.capacityTonnes === undefined
            ? undefined
            : new Prisma.Decimal(dto.capacityTonnes),
        status: dto.status,
        notes: dto.notes,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.VAT_LEACH_UNIT_UPDATED,
      entity: 'VatLeachUnit',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status: updated.status },
    });
    return updated;
  }

  async removeUnit(
    organizationId: string,
    branchId: string,
    id: string,
    userId: string,
  ) {
    await this.assertScope(organizationId, branchId, userId);
    const unit = await this.prisma.vatLeachUnit.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
    });
    if (!unit) throw new NotFoundException('Vat leach unit not found');

    const activeRentals = await this.prisma.vatLeachRental.count({
      where: {
        vatLeachUnitId: id,
        deletedAt: null,
        status: { in: ['PENDING', 'ACTIVE', 'OVERDUE'] },
      },
    });
    if (activeRentals > 0) {
      throw new BadRequestException(
        'Unit has active rentals — close them before deleting the unit',
      );
    }

    await this.prisma.vatLeachUnit.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DECOMMISSIONED' },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.VAT_LEACH_UNIT_DELETED,
      entity: 'VatLeachUnit',
      entityId: id,
      oldValues: { code: unit.code },
    });
    return { id, deleted: true };
  }

  // ─── Rentals ───────────────────────────────────────────────────────────────

  async createRental(
    organizationId: string,
    dto: CreateVatLeachRentalDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, dto.branchId, userId);

    if (dto.endDate && dto.endDate < dto.startDate) {
      throw new BadRequestException('endDate must be on or after startDate');
    }

    const rentalRate = new Prisma.Decimal(dto.rentalRate);
    const totalBilled =
      dto.totalBilled === undefined
        ? rentalRate
        : new Prisma.Decimal(dto.totalBilled);
    const depositHeld = new Prisma.Decimal(dto.depositHeld ?? 0);

    const rental = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        // The unit must live in the SAME branch as the rental — this closes
        // the child-resource IDOR where a valid branch is paired with another
        // tenant's (or another branch's) unit.
        const unit = await tx.vatLeachUnit.findFirst({
          where: {
            id: dto.vatLeachUnitId,
            organizationId,
            branchId: dto.branchId,
            deletedAt: null,
          },
        });
        if (!unit) throw new NotFoundException('Vat leach unit not found');
        if (unit.status !== 'AVAILABLE' && unit.status !== 'ASSIGNED') {
          throw new BadRequestException(
            `Unit ${unit.code} is ${unit.status} and cannot be rented out`,
          );
        }

        const reference = await generateVatLeachRentalReference(
          tx,
          dto.branchId,
        );

        const created = await tx.vatLeachRental.create({
          data: {
            organizationId,
            branchId: dto.branchId,
            vatLeachUnitId: dto.vatLeachUnitId,
            reference,
            status: 'ACTIVE',
            renterName: dto.renterName,
            renterPhone: dto.renterPhone,
            renterEmail: dto.renterEmail,
            renterIdNumber: dto.renterIdNumber,
            renterLocation: dto.renterLocation,
            rentalRate,
            depositHeld,
            totalBilled,
            totalPaid: new Prisma.Decimal(0),
            outstanding: totalBilled,
            currency: dto.currency,
            startDate: dto.startDate,
            endDate: dto.endDate,
            nextPaymentDue:
              dto.nextPaymentDue ?? addDays(dto.startDate, BILLING_CYCLE_DAYS),
            notes: dto.notes,
            recordedById: userId,
          },
        });

        await tx.vatLeachUnit.update({
          where: { id: unit.id },
          data: { status: 'ASSIGNED' },
        });

        return created;
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.VAT_LEACH_RENTAL_CREATED,
      entity: 'VatLeachRental',
      entityId: rental.id,
      newValues: {
        reference: rental.reference,
        renterName: rental.renterName,
        branchId: rental.branchId,
      },
    });
    return rental;
  }

  async findAllRentals(
    organizationId: string,
    userId: string,
    query: QueryVatLeachRentalsDto,
  ) {
    await this.assertScope(organizationId, query.branchId, userId);
    const { skip, take, orderBy } = buildPagination(query, 'startDate');

    const where: Prisma.VatLeachRentalWhereInput = {
      organizationId,
      branchId: query.branchId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    if (query.vatLeachUnitId) where.vatLeachUnitId = query.vatLeachUnitId;
    if (query.search) {
      where.OR = [
        { reference: { contains: query.search, mode: 'insensitive' } },
        { renterName: { contains: query.search, mode: 'insensitive' } },
        { renterPhone: { contains: query.search, mode: 'insensitive' } },
        { renterLocation: { contains: query.search, mode: 'insensitive' } },
        {
          vatLeachUnit: {
            code: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.vatLeachRental.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          vatLeachUnit: { select: { id: true, code: true, location: true } },
        },
      }),
      this.prisma.vatLeachRental.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  async findRentalById(
    organizationId: string,
    branchId: string,
    id: string,
    userId: string,
  ) {
    await this.assertScope(organizationId, branchId, userId);
    const rental = await this.prisma.vatLeachRental.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
      include: {
        vatLeachUnit: true,
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });
    if (!rental) throw new NotFoundException('Rental not found');
    return rental;
  }

  async updateRental(
    organizationId: string,
    branchId: string,
    id: string,
    dto: UpdateVatLeachRentalDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, branchId, userId);
    const existing = await this.prisma.vatLeachRental.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
    });
    if (!existing) throw new NotFoundException('Rental not found');

    const startDate = dto.startDate ?? existing.startDate;
    const endDate = dto.endDate ?? existing.endDate;
    if (endDate && endDate < startDate) {
      throw new BadRequestException('endDate must be on or after startDate');
    }

    const updated = await this.prisma.vatLeachRental.update({
      where: { id },
      data: {
        renterName: dto.renterName,
        renterPhone: dto.renterPhone,
        renterEmail: dto.renterEmail,
        renterIdNumber: dto.renterIdNumber,
        renterLocation: dto.renterLocation,
        rentalRate:
          dto.rentalRate === undefined
            ? undefined
            : new Prisma.Decimal(dto.rentalRate),
        currency: dto.currency,
        startDate: dto.startDate,
        endDate: dto.endDate,
        nextPaymentDue: dto.nextPaymentDue,
        status: dto.status,
        depositRefunded: dto.depositRefunded,
        notes: dto.notes,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.VAT_LEACH_RENTAL_UPDATED,
      entity: 'VatLeachRental',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status: updated.status },
    });
    return updated;
  }

  async removeRental(
    organizationId: string,
    branchId: string,
    id: string,
    userId: string,
  ) {
    await this.assertScope(organizationId, branchId, userId);
    const rental = await this.prisma.vatLeachRental.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
    });
    if (!rental) throw new NotFoundException('Rental not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.vatLeachRental.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'TERMINATED' },
      });
      // Free the unit if no other live rental holds it.
      const stillRented = await tx.vatLeachRental.count({
        where: {
          vatLeachUnitId: rental.vatLeachUnitId,
          deletedAt: null,
          status: { in: ['PENDING', 'ACTIVE', 'OVERDUE'] },
        },
      });
      if (stillRented === 0) {
        await tx.vatLeachUnit.updateMany({
          where: { id: rental.vatLeachUnitId, status: 'ASSIGNED' },
          data: { status: 'AVAILABLE' },
        });
      }
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.VAT_LEACH_RENTAL_DELETED,
      entity: 'VatLeachRental',
      entityId: id,
      oldValues: { reference: rental.reference },
    });
    return { id, deleted: true };
  }

  // ─── Payments ──────────────────────────────────────────────────────────────

  /**
   * Record a payment against a rental.
   *
   * The balance mutation uses atomic `increment`/`decrement` inside a
   * `$transaction` (never read-then-write), and the rental is re-read inside
   * the transaction so the "payment exceeds balance" check and the write see
   * the same row.
   */
  async recordPayment(
    organizationId: string,
    branchId: string,
    rentalId: string,
    dto: RecordVatLeachPaymentDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, branchId, userId);

    const amount = new Prisma.Decimal(dto.amount);
    const isDeposit = dto.isDeposit ?? false;
    const paidAt = dto.paidAt ?? new Date();

    const payment = await this.prisma.$transaction(async (tx) => {
      const rental = await tx.vatLeachRental.findFirst({
        where: { id: rentalId, ...branchScope(organizationId, branchId) },
      });
      if (!rental) throw new NotFoundException('Rental not found');
      if (rental.status === 'TERMINATED') {
        throw new BadRequestException(
          'Cannot record a payment against a terminated rental',
        );
      }

      const created = await tx.vatLeachPayment.create({
        data: {
          organizationId,
          branchId: rental.branchId,
          vatLeachRentalId: rental.id,
          amount,
          method: dto.method,
          reference: dto.reference,
          isDeposit,
          notes: dto.notes,
          paidAt,
        },
      });

      // Atomic decrement, THEN check — never read-then-check-then-write, which
      // would let two concurrent over-payments both pass a stale check and
      // silently absorb excess funds (fixes a lost-money race).
      const updated = await tx.vatLeachRental.update({
        where: { id: rental.id },
        data: isDeposit
          ? { depositHeld: { increment: amount }, lastPaymentAt: paidAt }
          : {
              totalPaid: { increment: amount },
              outstanding: { decrement: amount },
              lastPaymentAt: paidAt,
            },
      });

      if (!isDeposit) {
        if (updated.outstanding.lessThan(0)) {
          // Rolls back the decrement above.
          throw new BadRequestException(
            'Payment exceeds the outstanding balance on this rental',
          );
        }
        const outstanding = updated.outstanding;
        const settled = outstanding.lessThanOrEqualTo(0);
        const now = new Date();

        // Clearing the balance rolls the billing cycle forward.
        const nextPaymentDue = settled
          ? addDays(updated.nextPaymentDue ?? now, BILLING_CYCLE_DAYS)
          : updated.nextPaymentDue;

        let status: VatLeachRentalStatus = updated.status;
        if (settled && updated.endDate && updated.endDate <= now) {
          status = 'COMPLETED';
        } else if (!settled && nextPaymentDue && nextPaymentDue < now) {
          status = 'OVERDUE';
        } else {
          status = 'ACTIVE';
        }

        await tx.vatLeachRental.update({
          where: { id: rental.id },
          data: { outstanding, nextPaymentDue, status },
        });
      }

      return created;
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.VAT_LEACH_PAYMENT_RECORDED,
      entity: 'VatLeachPayment',
      entityId: payment.id,
      newValues: {
        vatLeachRentalId: rentalId,
        amount: dto.amount,
        isDeposit,
      },
    });
    return payment;
  }

  /** "Payment History" tab. */
  async findPayments(
    organizationId: string,
    userId: string,
    query: QueryVatLeachPaymentsDto,
  ) {
    await this.assertScope(organizationId, query.branchId, userId);
    const { skip, take, orderBy } = buildPagination(query, 'paidAt');

    const where: Prisma.VatLeachPaymentWhereInput = {
      organizationId,
      branchId: query.branchId,
      // Payments of soft-deleted rentals must not leak into the history.
      rental: { deletedAt: null },
    };
    if (query.vatLeachRentalId) {
      where.vatLeachRentalId = query.vatLeachRentalId;
    }
    if (query.isDeposit !== undefined) where.isDeposit = query.isDeposit;
    if (query.from || query.to) {
      where.paidAt = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }
    if (query.search) {
      where.OR = [
        { reference: { contains: query.search, mode: 'insensitive' } },
        {
          rental: {
            renterName: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          rental: {
            reference: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.vatLeachPayment.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          rental: {
            select: { id: true, reference: true, renterName: true },
          },
        },
      }),
      this.prisma.vatLeachPayment.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  /** Payment history for one rental (child scoped to the caller's org). */
  async findRentalPayments(
    organizationId: string,
    rentalId: string,
    userId: string,
    query: QueryVatLeachPaymentsDto,
  ) {
    await this.assertScope(organizationId, query.branchId, userId);
    const rental = await this.prisma.vatLeachRental.findFirst({
      where: {
        id: rentalId,
        organizationId,
        branchId: query.branchId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!rental) throw new NotFoundException('Rental not found');

    return this.findPayments(organizationId, userId, {
      ...query,
      vatLeachRentalId: rentalId,
    });
  }

  /** "Payment Reminders" tab — overdue plus soon-to-be-due rentals. */
  async findPaymentReminders(
    organizationId: string,
    userId: string,
    query: QueryPaymentRemindersDto,
  ) {
    await this.assertScope(organizationId, query.branchId, userId);
    const { skip, take } = buildPagination(query, 'nextPaymentDue');

    const horizon = addDays(new Date(), query.withinDays ?? 7);
    const where: Prisma.VatLeachRentalWhereInput = {
      organizationId,
      branchId: query.branchId,
      deletedAt: null,
      status: { in: ['PENDING', 'ACTIVE', 'OVERDUE'] },
      outstanding: { gt: 0 },
      nextPaymentDue: { not: null, lte: horizon },
    };
    if (query.search) {
      where.OR = [
        { reference: { contains: query.search, mode: 'insensitive' } },
        { renterName: { contains: query.search, mode: 'insensitive' } },
        { renterPhone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const now = new Date();
    const [rows, total] = await Promise.all([
      this.prisma.vatLeachRental.findMany({
        where,
        skip,
        take,
        orderBy: { nextPaymentDue: 'asc' },
        include: {
          vatLeachUnit: { select: { id: true, code: true, location: true } },
        },
      }),
      this.prisma.vatLeachRental.count({ where }),
    ]);

    const items = rows.map((rental) => {
      const due = rental.nextPaymentDue as Date;
      const daysUntilDue = Math.ceil(
        (due.getTime() - now.getTime()) / 86_400_000,
      );
      return { ...rental, daysUntilDue, isOverdue: daysUntilDue < 0 };
    });

    return { items, meta: buildPaginatedMeta(total, query) };
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  /** Drives the "KSh n Deposits Held" card and the surrounding counters. */
  async getStats(organizationId: string, branchId: string, userId: string) {
    await this.assertScope(organizationId, branchId, userId);

    const rentalScope: Prisma.VatLeachRentalWhereInput = {
      organizationId,
      branchId,
      deletedAt: null,
    };
    const activeStatuses: VatLeachRentalStatus[] = [
      'PENDING',
      'ACTIVE',
      'OVERDUE',
    ];
    const now = new Date();

    const [
      depositsHeld,
      outstandingTotals,
      unitsByStatus,
      rentalsByStatus,
      totalUnits,
      activeRentals,
      overdueRentals,
    ] = await Promise.all([
      this.prisma.vatLeachRental.aggregate({
        where: {
          ...rentalScope,
          status: { in: activeStatuses },
          depositRefunded: false,
        },
        _sum: { depositHeld: true },
      }),
      this.prisma.vatLeachRental.aggregate({
        where: { ...rentalScope, status: { in: activeStatuses } },
        _sum: { outstanding: true, totalPaid: true, totalBilled: true },
      }),
      this.prisma.vatLeachUnit.groupBy({
        by: ['status'],
        where: { organizationId, branchId, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.vatLeachRental.groupBy({
        by: ['status'],
        where: rentalScope,
        _count: { _all: true },
      }),
      this.prisma.vatLeachUnit.count({
        where: { organizationId, branchId, deletedAt: null },
      }),
      this.prisma.vatLeachRental.count({
        where: { ...rentalScope, status: { in: activeStatuses } },
      }),
      this.prisma.vatLeachRental.count({
        where: {
          ...rentalScope,
          status: { in: activeStatuses },
          outstanding: { gt: 0 },
          nextPaymentDue: { lt: now },
        },
      }),
    ]);

    const zero = new Prisma.Decimal(0);
    return {
      depositsHeld: depositsHeld._sum.depositHeld ?? zero,
      totalOutstanding: outstandingTotals._sum.outstanding ?? zero,
      totalPaid: outstandingTotals._sum.totalPaid ?? zero,
      totalBilled: outstandingTotals._sum.totalBilled ?? zero,
      totalUnits,
      activeRentals,
      overdueRentals,
      unitsByStatus: Object.fromEntries(
        unitsByStatus.map((row) => [row.status, row._count._all]),
      ),
      rentalsByStatus: Object.fromEntries(
        rentalsByStatus.map((row) => [row.status, row._count._all]),
      ),
    };
  }
}
