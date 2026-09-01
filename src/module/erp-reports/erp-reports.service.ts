import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SalesService } from '../sales/sales.service';
import { ExpensesService } from '../expenses/expenses.service';
import { InventoryService } from '../inventory/inventory.service';
import { DebtService } from '../debt/debt.service';
import { AccountsService } from '../accounts/accounts.service';
import { ErpCustomersService } from '../erp-customers/erp-customers.service';
import { HrService } from '../hr/hr.service';
import {
  QueryReportsOverviewDto,
  ReportRange,
} from './dto/query-reports-overview.dto';

/** One point on the trailing revenue-vs-expenses trend. */
export interface MonthlyPoint {
  /** `YYYY-MM`, e.g. `2026-08`. */
  month: string;
  revenue: number;
  expenses: number;
}

export interface ReportsOverview {
  range: ReportRange;
  from: string;
  to: string;
  branchId: string;
  totalRevenue: string;
  ordersCount: number;
  totalExpenses: string;
  expenseRecords: number;
  netProfit: string;
  profitMargin: number;
  avgOrderValue: string;
  stockValue: string;
  stockItems: number;
  outstandingDebt: string;
  debtOverdue: number;
  lowStock: number;
  outOfStock: number;
  cashBalance: string;
  accountsCount: number;
  customersCount: number;
  staffCount: number;
  monthly: MonthlyPoint[];
  expensesByCategory: ExpenseCategoryPoint[];
}

/** One slice of the in-range expense total, largest first. */
export interface ExpenseCategoryPoint {
  categoryId: string | null;
  name: string;
  total: number;
}

const DEFAULT_TREND_MONTHS = 12;

@Injectable()
export class ErpReportsService {
  constructor(
    private readonly sales: SalesService,
    private readonly expenses: ExpensesService,
    private readonly inventory: InventoryService,
    private readonly debt: DebtService,
    private readonly accounts: AccountsService,
    private readonly customers: ErpCustomersService,
    private readonly hr: HrService,
  ) {}

  /**
   * Single cross-module snapshot for the admin reports screen. Every number
   * here is aggregated live from the owning module's own service, so the
   * reports page can never drift from what the individual ERP screens show.
   */
  async getOverview(
    organizationId: string,
    userId: string,
    query: QueryReportsOverviewDto,
  ): Promise<ReportsOverview> {
    const range = query.range ?? ReportRange.MONTH;
    const { from, to } = resolveWindow(range, query.from, query.to);
    const branchId = query.branchId;
    const scoped = { branchId, from, to };

    const trendMonths = query.months ?? DEFAULT_TREND_MONTHS;
    const trendFrom = startOfMonthsAgo(to, trendMonths - 1);

    // Each service re-verifies org membership and branch-in-org itself, so a
    // forged branchId is rejected before any of these reach a where clause.
    const [
      revenue,
      expenseStats,
      stock,
      debtStats,
      accountSummary,
      customersCount,
      staffCount,
      monthlyRevenue,
      monthlyExpenses,
      expensesByCategory,
    ] = await Promise.all([
      this.sales.getRevenueSummary(organizationId, userId, scoped),
      this.expenses.getStats(organizationId, userId, scoped),
      this.inventory.getStats(organizationId, userId, { branchId }),
      this.debt.getStats(organizationId, userId, { branchId }),
      this.accounts.getSummary(organizationId, userId, { branchId }),
      this.customers.getCount(organizationId, userId, branchId),
      this.hr
        .getOverview(organizationId, branchId, userId)
        .then((o) => o.headcount)
        .catch(() => 0),
      this.sales.getMonthlyRevenue(organizationId, userId, {
        branchId,
        from: trendFrom,
        to,
      }),
      this.expenses.getMonthlyTotals(organizationId, userId, {
        branchId,
        from: trendFrom,
        to,
      }),
      this.expenses.getCategoryBreakdown(organizationId, userId, scoped),
    ]);

    const totalRevenue = new Prisma.Decimal(revenue.totalRevenue);
    const totalExpenses = new Prisma.Decimal(expenseStats.totalExpenses);
    const netProfit = totalRevenue.minus(totalExpenses);
    const profitMargin = totalRevenue.isZero()
      ? 0
      : netProfit
          .dividedBy(totalRevenue)
          .times(100)
          .toDecimalPlaces(2)
          .toNumber();

    return {
      range,
      from: from.toISOString(),
      to: to.toISOString(),
      branchId,
      totalRevenue: totalRevenue.toString(),
      ordersCount: revenue.saleCount,
      totalExpenses: totalExpenses.toString(),
      expenseRecords: expenseStats.recordCount,
      netProfit: netProfit.toString(),
      profitMargin,
      avgOrderValue: revenue.averageSale,
      stockValue: stock.stockOnHandValue,
      stockItems: stock.totalItems,
      outstandingDebt: debtStats.totalOutstanding,
      debtOverdue: debtStats.overdueCount,
      lowStock: stock.lowStockCount,
      outOfStock: stock.outOfStockCount,
      cashBalance: accountSummary.totalBalance,
      accountsCount: accountSummary.accountCount,
      customersCount,
      staffCount,
      monthly: buildTrend(trendFrom, to, monthlyRevenue, monthlyExpenses),
      expensesByCategory: expensesByCategory.map((row) => ({
        categoryId: row.categoryId,
        name: row.name,
        total: Number(row.total),
      })),
    };
  }
}

/** Resolves a preset (or explicit custom) window to a concrete [from, to]. */
function resolveWindow(
  range: ReportRange,
  from?: Date,
  to?: Date,
): { from: Date; to: Date } {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);
  endOfToday.setMilliseconds(-1);

  switch (range) {
    case ReportRange.TODAY:
      return { from: startOfToday, to: endOfToday };

    case ReportRange.YESTERDAY: {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 1);
      const end = new Date(startOfToday);
      end.setMilliseconds(-1);
      return { from: start, to: end };
    }

    case ReportRange.WEEK: {
      // Week starts Monday, matching Kenyan business reporting convention.
      const start = new Date(startOfToday);
      const weekday = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - weekday);
      return { from: start, to: endOfToday };
    }

    case ReportRange.MONTH:
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: endOfToday,
      };

    case ReportRange.CUSTOM: {
      if (!from || !to) {
        throw new BadRequestException(
          'range=custom requires both "from" and "to"',
        );
      }
      if (from > to) {
        throw new BadRequestException('"from" must not be after "to"');
      }
      return { from, to };
    }
  }
}

/**
 * First instant of the UTC month `count` months before `reference`. UTC
 * because the per-month SQL grouping runs in the connection's UTC session
 * timezone — mixing the two would yield an extra leading bucket.
 */
function startOfMonthsAgo(reference: Date, count: number): Date {
  return new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - count, 1),
  );
}

/**
 * Densifies the two sparse per-month aggregates into one continuous series so
 * a month with no activity charts as a real zero rather than vanishing.
 */
function buildTrend(
  from: Date,
  to: Date,
  revenueRows: { month: string; total: string }[],
  expenseRows: { month: string; total: string }[],
): MonthlyPoint[] {
  const revenueByMonth = new Map(revenueRows.map((r) => [r.month, r.total]));
  const expensesByMonth = new Map(expenseRows.map((r) => [r.month, r.total]));

  // Postgres `date_trunc` runs in the connection's UTC session timezone, so
  // the month keys generated here must be UTC too or the two would not line up
  // for callers east or west of Greenwich.
  const points: MonthlyPoint[] = [];
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1),
  );
  const last = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));

  while (cursor <= last) {
    const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`;
    points.push({
      month: key,
      revenue: Number(revenueByMonth.get(key) ?? 0),
      expenses: Number(expensesByMonth.get(key) ?? 0),
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return points;
}
