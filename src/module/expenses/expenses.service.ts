import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
import {
  generateExpenseReference,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
  ) {}

  // ─── Expenses ─────────────────────────────────────────────────────────────

  async create(organizationId: string, data: CreateExpenseDto, userId: string) {
    await this.assertScope(organizationId, userId, data.branchId);
    await this.assertExpenseReferences(organizationId, data.branchId, data);

    const expense = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        const reference = await generateExpenseReference(tx, data.branchId);
        return tx.expense.create({
          data: {
            organizationId,
            branchId: data.branchId,
            categoryId: data.categoryId,
            accountId: data.accountId,
            reference,
            description: data.description,
            amount: new Prisma.Decimal(data.amount),
            currency: data.currency ?? 'KES',
            method: data.method ?? 'CASH',
            receiptUrl: data.receiptUrl,
            incurredAt: data.incurredAt ?? new Date(),
            recordedById: userId,
          },
        });
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.EXPENSE_CREATED,
      entity: 'Expense',
      entityId: expense.id,
      metadata: {
        branchId: data.branchId,
        reference: expense.reference,
        amount: expense.amount.toString(),
      },
    });
    return expense;
  }

  async findAll(
    organizationId: string,
    userId: string,
    query: QueryExpensesDto,
  ) {
    await this.assertScope(organizationId, userId, query.branchId);
    const { skip, take, orderBy } = buildPagination(query, 'incurredAt');

    const where: Prisma.ExpenseWhereInput = branchScope(
      organizationId,
      query.branchId,
    );
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.accountId) where.accountId = query.accountId;
    if (query.from || query.to) {
      where.incurredAt = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }
    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { reference: { contains: query.search, mode: 'insensitive' } },
        {
          category: { name: { contains: query.search, mode: 'insensitive' } },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: { select: { id: true, name: true } },
          account: { select: { id: true, name: true } },
          recordedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.expense.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  async findById(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ) {
    await this.assertScope(organizationId, userId, branchId);
    const expense = await this.prisma.expense.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
      include: {
        category: { select: { id: true, name: true } },
        account: { select: { id: true, name: true } },
      },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateExpenseDto,
    userId: string,
  ) {
    await this.findById(organizationId, id, userId, data.branchId);
    await this.assertExpenseReferences(organizationId, data.branchId, data);

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        categoryId: data.categoryId,
        accountId: data.accountId,
        description: data.description,
        amount:
          data.amount !== undefined
            ? new Prisma.Decimal(data.amount)
            : undefined,
        currency: data.currency,
        method: data.method,
        receiptUrl: data.receiptUrl,
        incurredAt: data.incurredAt,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.EXPENSE_UPDATED,
      entity: 'Expense',
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
    await this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.EXPENSE_DELETED,
      entity: 'Expense',
      entityId: id,
      metadata: { branchId },
    });
    return { id, deleted: true };
  }

  /** Total expenses and record count, optionally over a date range. */
  async getStats(
    organizationId: string,
    userId: string,
    query: BranchScopeQueryDto & { from?: Date; to?: Date },
  ) {
    await this.assertScope(organizationId, userId, query.branchId);

    const where: Prisma.ExpenseWhereInput = branchScope(
      organizationId,
      query.branchId,
    );
    if (query.from || query.to) {
      where.incurredAt = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }

    const [aggregate, byCategory] = await Promise.all([
      this.prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    return {
      totalExpenses: new Prisma.Decimal(aggregate._sum.amount ?? 0).toString(),
      recordCount: aggregate._count._all,
      byCategory: byCategory.map((row) => ({
        categoryId: row.categoryId,
        total: new Prisma.Decimal(row._sum.amount ?? 0).toString(),
        count: row._count._all,
      })),
    };
  }

  // ─── Categories ───────────────────────────────────────────────────────────

  async createCategory(
    organizationId: string,
    data: CreateExpenseCategoryDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, userId, data.branchId);
    const category = await this.prisma.expenseCategory.create({
      data: {
        organizationId,
        branchId: data.branchId,
        name: data.name,
        description: data.description,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.EXPENSE_CATEGORY_CREATED,
      entity: 'ExpenseCategory',
      entityId: category.id,
      metadata: { branchId: data.branchId },
    });
    return category;
  }

  async findAllCategories(
    organizationId: string,
    userId: string,
    query: PaginationDto & { branchId: string },
  ) {
    await this.assertScope(organizationId, userId, query.branchId);
    const { skip, take, orderBy } = buildPagination(query, 'name');
    const where: Prisma.ExpenseCategoryWhereInput = branchScope(
      organizationId,
      query.branchId,
    );
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.expenseCategory.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { _count: { select: { expenses: true } } },
      }),
      this.prisma.expenseCategory.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  async findCategoryById(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ) {
    await this.assertScope(organizationId, userId, branchId);
    const category = await this.prisma.expenseCategory.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
    });
    if (!category) throw new NotFoundException('Expense category not found');
    return category;
  }

  async updateCategory(
    organizationId: string,
    id: string,
    data: UpdateExpenseCategoryDto,
    userId: string,
  ) {
    await this.findCategoryById(organizationId, id, userId, data.branchId);
    const updated = await this.prisma.expenseCategory.update({
      where: { id },
      data: { name: data.name, description: data.description },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.EXPENSE_CATEGORY_UPDATED,
      entity: 'ExpenseCategory',
      entityId: id,
      metadata: { branchId: data.branchId },
    });
    return updated;
  }

  async softDeleteCategory(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ) {
    await this.findCategoryById(organizationId, id, userId, branchId);
    await this.prisma.expenseCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.EXPENSE_CATEGORY_DELETED,
      entity: 'ExpenseCategory',
      entityId: id,
      metadata: { branchId },
    });
    return { id, deleted: true };
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async assertExpenseReferences(
    organizationId: string,
    branchId: string,
    data: Pick<CreateExpenseDto, 'categoryId' | 'accountId'>,
  ): Promise<void> {
    if (data.categoryId) {
      const category = await this.prisma.expenseCategory.findFirst({
        where: {
          id: data.categoryId,
          ...branchScope(organizationId, branchId),
        },
        select: { id: true },
      });
      if (!category) throw new NotFoundException('Expense category not found');
    }
    if (data.accountId) {
      const account = await this.prisma.financialAccount.findFirst({
        where: { id: data.accountId, ...branchScope(organizationId, branchId) },
        select: { id: true },
      });
      if (!account) throw new NotFoundException('Financial account not found');
    }
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
