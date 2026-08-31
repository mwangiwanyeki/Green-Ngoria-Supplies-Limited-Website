import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DebtAccountStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { OrganizationsService } from '../organizations/organizations.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BranchScopeQueryDto } from '../../common/dto/branch-scope.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import {
  assertBranchInOrganization,
  branchScope,
} from '../../common/utils/branch-scope.util';
import { resolveDebtStatus } from '../../common/utils/debt-status.util';
import { QueryDebtAccountsDto } from './dto/query-debt-accounts.dto';
import { RecordDebtPaymentDto } from './dto/record-debt-payment.dto';
import { UpdateDebtAccountDto } from './dto/update-debt-account.dto';

@Injectable()
export class DebtService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
  ) {}

  async findAllAccounts(
    organizationId: string,
    userId: string,
    query: QueryDebtAccountsDto,
  ) {
    await this.assertScope(organizationId, userId, query.branchId);
    const { skip, take, orderBy } = buildPagination(query);

    const where: Prisma.CustomerDebtAccountWhereInput = branchScope(
      organizationId,
      query.branchId,
    );

    if (query.status === DebtAccountStatus.OVERDUE) {
      // An account can be past its due date before a payment has re-derived
      // its stored status, so match either shape.
      where.OR = [
        { status: DebtAccountStatus.OVERDUE },
        {
          status: {
            notIn: [DebtAccountStatus.SETTLED, DebtAccountStatus.WRITTEN_OFF],
          },
          outstanding: { gt: 0 },
          dueDate: { lt: new Date() },
        },
      ];
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.customer = {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
          { company: { contains: query.search, mode: 'insensitive' } },
          { customerNumber: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.customerDebtAccount.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              company: true,
              customerNumber: true,
            },
          },
        },
      }),
      this.prisma.customerDebtAccount.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  async findAccountById(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ) {
    await this.assertScope(organizationId, userId, branchId);
    const account = await this.prisma.customerDebtAccount.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
      include: {
        customer: true,
        payments: {
          orderBy: { paidAt: 'desc' },
          include: {
            receivedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            sale: { select: { id: true, receiptNumber: true } },
          },
        },
      },
    });
    if (!account) throw new NotFoundException('Debt account not found');
    return account;
  }

  async findAccountPayments(
    organizationId: string,
    id: string,
    userId: string,
    query: PaginationDto & { branchId: string },
  ) {
    // Parent ownership proven before any payment row is read.
    await this.assertAccountInScope(organizationId, id, userId, query.branchId);

    const { skip, take, orderBy } = buildPagination(query, 'paidAt');
    const where: Prisma.DebtPaymentWhereInput = {
      debtAccountId: id,
      organizationId,
      branchId: query.branchId,
    };

    const [items, total] = await Promise.all([
      this.prisma.debtPayment.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          receivedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          sale: { select: { id: true, receiptNumber: true } },
        },
      }),
      this.prisma.debtPayment.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  async updateAccount(
    organizationId: string,
    id: string,
    data: UpdateDebtAccountDto,
    userId: string,
  ) {
    await this.assertAccountInScope(organizationId, id, userId, data.branchId);

    const updated = await this.prisma.customerDebtAccount.update({
      where: { id },
      data: {
        creditLimit:
          data.creditLimit !== undefined
            ? new Prisma.Decimal(data.creditLimit)
            : undefined,
        dueDate: data.dueDate,
        status: data.status,
        notes: data.notes,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.DEBT_ACCOUNT_UPDATED,
      entity: 'CustomerDebtAccount',
      entityId: id,
      metadata: { branchId: data.branchId },
    });
    return updated;
  }

  /**
   * Records a payment against a debt account.
   *
   * The balance moves with atomic `decrement`/`increment` inside a
   * transaction — the outstanding value is never read, adjusted in JS and
   * written back — so two cashiers taking payments at once cannot lose one.
   * The over-payment check and the status derivation both use the value
   * RETURNED by the update, i.e. the balance that actually committed.
   */
  async recordPayment(
    organizationId: string,
    accountId: string,
    data: RecordDebtPaymentDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, userId, data.branchId);
    const amount = new Prisma.Decimal(data.amount);

    const payment = await this.prisma.$transaction(async (tx) => {
      const account = await tx.customerDebtAccount.findFirst({
        where: {
          id: accountId,
          ...branchScope(organizationId, data.branchId),
        },
        select: { id: true, customerId: true },
      });
      if (!account) throw new NotFoundException('Debt account not found');

      if (data.saleId) {
        // The sale must belong to the same org, branch AND customer —
        // otherwise a payment could be pinned to another tenant's receipt.
        const sale = await tx.sale.findFirst({
          where: {
            id: data.saleId,
            customerId: account.customerId,
            ...branchScope(organizationId, data.branchId),
          },
          select: { id: true },
        });
        if (!sale) throw new NotFoundException('Sale not found');
      }

      const updated = await tx.customerDebtAccount.update({
        where: { id: accountId },
        data: {
          outstanding: { decrement: amount },
          totalPaid: { increment: amount },
          lastPaymentAt: data.paidAt ?? new Date(),
        },
      });

      if (updated.outstanding.lessThan(0)) {
        throw new BadRequestException(
          'Payment exceeds the outstanding balance',
        );
      }

      await tx.customerDebtAccount.update({
        where: { id: accountId },
        data: {
          status: resolveDebtStatus(
            updated.outstanding,
            updated.dueDate,
            updated.status,
          ),
        },
      });

      return tx.debtPayment.create({
        data: {
          organizationId,
          branchId: data.branchId,
          debtAccountId: accountId,
          saleId: data.saleId,
          amount,
          method: data.method,
          reference: data.reference,
          notes: data.notes,
          receivedById: userId,
          paidAt: data.paidAt ?? new Date(),
        },
      });
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.DEBT_PAYMENT_RECORDED,
      entity: 'DebtPayment',
      entityId: payment.id,
      metadata: {
        branchId: data.branchId,
        debtAccountId: accountId,
        amount: amount.toString(),
      },
    });
    return payment;
  }

  /** Total outstanding, overdue count and customer count for the branch. */
  async getStats(
    organizationId: string,
    userId: string,
    query: BranchScopeQueryDto,
  ) {
    await this.assertScope(organizationId, userId, query.branchId);
    const scope = branchScope(organizationId, query.branchId);
    const now = new Date();

    const [aggregate, overdueCount, customerCount] = await Promise.all([
      this.prisma.customerDebtAccount.aggregate({
        where: { ...scope, outstanding: { gt: 0 } },
        _sum: { outstanding: true },
      }),
      this.prisma.customerDebtAccount.count({
        where: {
          ...scope,
          OR: [
            { status: DebtAccountStatus.OVERDUE },
            {
              status: {
                notIn: [
                  DebtAccountStatus.SETTLED,
                  DebtAccountStatus.WRITTEN_OFF,
                ],
              },
              outstanding: { gt: 0 },
              dueDate: { lt: now },
            },
          ],
        },
      }),
      this.prisma.customerDebtAccount.count({
        where: { ...scope, outstanding: { gt: 0 } },
      }),
    ]);

    return {
      totalOutstanding: new Prisma.Decimal(
        aggregate._sum.outstanding ?? 0,
      ).toString(),
      overdueCount,
      customerCount,
    };
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async assertAccountInScope(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ): Promise<void> {
    await this.assertScope(organizationId, userId, branchId);
    const account = await this.prisma.customerDebtAccount.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
      select: { id: true },
    });
    if (!account) throw new NotFoundException('Debt account not found');
  }

  private async assertScope(
    organizationId: string,
    userId: string,
    branchId: string,
  ): Promise<void> {
    await this.orgsService.assertMembership(organizationId, userId);
    await assertBranchInOrganization(this.prisma, organizationId, branchId);
  }
}
