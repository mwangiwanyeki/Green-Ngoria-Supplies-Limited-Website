import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountTransactionType, Prisma } from '@prisma/client';
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
import { CreateFinancialAccountDto } from './dto/create-financial-account.dto';
import { UpdateFinancialAccountDto } from './dto/update-financial-account.dto';
import { CreateManualEntryDto } from './dto/create-manual-entry.dto';
import { QueryAccountTransactionsDto } from './dto/query-account-transactions.dto';

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
  ) {}

  // ─── Accounts ─────────────────────────────────────────────────────────────

  async create(
    organizationId: string,
    data: CreateFinancialAccountDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, userId, data.branchId);
    const openingBalance = new Prisma.Decimal(data.openingBalance ?? 0);

    const account = await this.prisma.$transaction(async (tx) => {
      const created = await tx.financialAccount.create({
        data: {
          organizationId,
          branchId: data.branchId,
          name: data.name,
          type: data.type,
          accountNumber: data.accountNumber,
          provider: data.provider,
          currency: data.currency ?? 'KES',
          openingBalance,
          currentBalance: openingBalance,
          isActive: data.isActive ?? true,
          description: data.description,
        },
      });

      // The opening balance enters the ledger so transactions always
      // reconcile to `currentBalance`.
      if (!openingBalance.isZero()) {
        await tx.accountTransaction.create({
          data: {
            organizationId,
            branchId: data.branchId,
            accountId: created.id,
            type: openingBalance.greaterThan(0)
              ? AccountTransactionType.CREDIT
              : AccountTransactionType.DEBIT,
            amount: openingBalance.abs(),
            balanceAfter: openingBalance,
            description: 'Opening balance',
            referenceType: 'FinancialAccount',
            referenceId: created.id,
            isManualEntry: false,
            recordedById: userId,
          },
        });
      }

      return created;
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.FINANCIAL_ACCOUNT_CREATED,
      entity: 'FinancialAccount',
      entityId: account.id,
      metadata: { branchId: data.branchId },
    });
    return account;
  }

  async findAll(
    organizationId: string,
    userId: string,
    query: PaginationDto & { branchId: string },
  ) {
    await this.assertScope(organizationId, userId, query.branchId);
    const { skip, take, orderBy } = buildPagination(query, 'name');

    const where: Prisma.FinancialAccountWhereInput = branchScope(
      organizationId,
      query.branchId,
    );
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { provider: { contains: query.search, mode: 'insensitive' } },
        { accountNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.financialAccount.findMany({ where, skip, take, orderBy }),
      this.prisma.financialAccount.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, query) };
  }

  /** Combined balance and account count across the branch. */
  async getSummary(
    organizationId: string,
    userId: string,
    query: BranchScopeQueryDto,
  ) {
    await this.assertScope(organizationId, userId, query.branchId);
    const scope = branchScope(organizationId, query.branchId);

    const [aggregate, byType] = await Promise.all([
      this.prisma.financialAccount.aggregate({
        where: scope,
        _sum: { currentBalance: true },
        _count: { _all: true },
      }),
      this.prisma.financialAccount.groupBy({
        by: ['type'],
        where: scope,
        _sum: { currentBalance: true },
      }),
    ]);

    return {
      totalBalance: new Prisma.Decimal(
        aggregate._sum.currentBalance ?? 0,
      ).toString(),
      accountCount: aggregate._count._all,
      byType: byType.map((row) => ({
        type: row.type,
        balance: new Prisma.Decimal(row._sum.currentBalance ?? 0).toString(),
      })),
    };
  }

  async findById(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ) {
    await this.assertScope(organizationId, userId, branchId);
    const account = await this.prisma.financialAccount.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
    });
    if (!account) throw new NotFoundException('Financial account not found');
    return account;
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateFinancialAccountDto,
    userId: string,
  ) {
    await this.findById(organizationId, id, userId, data.branchId);

    const updated = await this.prisma.financialAccount.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        accountNumber: data.accountNumber,
        provider: data.provider,
        currency: data.currency,
        isActive: data.isActive,
        description: data.description,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.FINANCIAL_ACCOUNT_UPDATED,
      entity: 'FinancialAccount',
      entityId: id,
      metadata: { branchId: data.branchId },
    });
    return updated;
  }

  async softDelete(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ) {
    await this.findById(organizationId, id, userId, branchId);
    await this.prisma.financialAccount.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.FINANCIAL_ACCOUNT_DELETED,
      entity: 'FinancialAccount',
      entityId: id,
      metadata: { branchId },
    });
    return { id, deleted: true };
  }

  // ─── Transactions ─────────────────────────────────────────────────────────

  async findTransactions(
    organizationId: string,
    accountId: string,
    userId: string,
    query: QueryAccountTransactionsDto,
  ) {
    // The parent account must belong to this org + branch before any of its
    // transactions are read.
    await this.findById(organizationId, accountId, userId, query.branchId);

    const { skip, take, orderBy } = buildPagination(query, 'occurredAt');
    const where: Prisma.AccountTransactionWhereInput = {
      accountId,
      organizationId,
      branchId: query.branchId,
    };
    if (query.type) where.type = query.type;
    if (query.isManualEntry !== undefined) {
      where.isManualEntry = query.isManualEntry;
    }
    if (query.from || query.to) {
      where.occurredAt = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }
    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { reference: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.accountTransaction.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          recordedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.accountTransaction.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  /**
   * The "Manual Entry" action: posts a ledger row and moves the balance.
   *
   * The balance is mutated with an atomic `increment`/`decrement` inside a
   * transaction and `balanceAfter` is taken from the value the update
   * RETURNED — so concurrent entries each get the balance they actually
   * produced, and no update is lost to a stale read.
   */
  async createManualEntry(
    organizationId: string,
    accountId: string,
    data: CreateManualEntryDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, userId, data.branchId);
    const amount = new Prisma.Decimal(data.amount);
    const isCredit = data.type === AccountTransactionType.CREDIT;

    const transaction = await this.prisma.$transaction(async (tx) => {
      const account = await tx.financialAccount.findFirst({
        where: {
          id: accountId,
          ...branchScope(organizationId, data.branchId),
        },
        select: { id: true },
      });
      if (!account) throw new NotFoundException('Financial account not found');

      const updated = await tx.financialAccount.update({
        where: { id: accountId },
        data: {
          currentBalance: isCredit
            ? { increment: amount }
            : { decrement: amount },
        },
      });

      return tx.accountTransaction.create({
        data: {
          organizationId,
          branchId: data.branchId,
          accountId,
          type: data.type,
          amount,
          balanceAfter: updated.currentBalance,
          description: data.description,
          reference: data.reference,
          isManualEntry: true,
          recordedById: userId,
          occurredAt: data.occurredAt ?? new Date(),
        },
      });
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.ACCOUNT_MANUAL_ENTRY_CREATED,
      entity: 'AccountTransaction',
      entityId: transaction.id,
      metadata: {
        branchId: data.branchId,
        accountId,
        type: data.type,
        amount: amount.toString(),
        balanceAfter: transaction.balanceAfter.toString(),
      },
    });
    return transaction;
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async assertScope(
    organizationId: string,
    userId: string,
    branchId: string,
  ): Promise<void> {
    await this.orgsService.assertMembership(organizationId, userId);
    await assertBranchInOrganization(this.prisma, organizationId, branchId);
  }
}
