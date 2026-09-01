'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '../api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useBranchStore } from '@/stores/branch-store';

export type ReportRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export interface ReportsMonthlyPoint {
  /** `YYYY-MM`, e.g. `2026-08`. */
  month: string;
  revenue: number;
  expenses: number;
}

/**
 * Mirrors the `ReportsOverview` returned by
 * `GET /organizations/:orgId/erp/reports/overview`. Money fields arrive as
 * decimal strings so no precision is lost in transit.
 */
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
  monthly: ReportsMonthlyPoint[];
  expensesByCategory: ReportsExpenseCategory[];
}

/** One slice of the in-range expense total, largest first. */
export interface ReportsExpenseCategory {
  categoryId: string | null;
  name: string;
  total: number;
}

export interface ReportsOverviewParams {
  range: ReportRange;
  /** ISO date, required by the API when `range === 'custom'`. */
  from?: string;
  to?: string;
  /** Trailing months covered by the revenue/expense trend (1–24). */
  months?: number;
}

/**
 * The branch id is a required query parameter on every ERP read endpoint, so
 * the query stays disabled until a branch has actually been selected rather
 * than firing a request the API would reject.
 */
export function useReportsOverview(params: ReportsOverviewParams) {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const branchId = useBranchStore((s) => s.activeBranchId);

  const custom = params.range === 'custom';
  const query = {
    branchId,
    range: params.range,
    ...(custom && params.from ? { from: params.from } : {}),
    ...(custom && params.to ? { to: params.to } : {}),
    ...(params.months ? { months: params.months } : {}),
  };

  return useQuery<ReportsOverview>({
    queryKey: ['erp', orgId, branchId, 'erp/reports/overview', query],
    queryFn: () =>
      get<ReportsOverview>(`/organizations/${orgId}/erp/reports/overview`, {
        params: query,
      }).then((r) => r.data),
    enabled:
      !!accessToken &&
      !!orgId &&
      !!branchId &&
      (!custom || (!!params.from && !!params.to)),
  });
}
