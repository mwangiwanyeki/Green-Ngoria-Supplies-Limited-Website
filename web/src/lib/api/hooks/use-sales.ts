'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post } from '../api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useBranchStore } from '@/stores/branch-store';
import { useErpList } from './use-erp';
import { QK } from '../query-keys';

// ─── Enums (mirror Prisma / backend) ─────────────────────────────────────────

export const SALE_STATUSES = [
  'DRAFT',
  'COMPLETED',
  'PARTIALLY_PAID',
  'CREDIT',
  'VOIDED',
  'REFUNDED',
] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export const SALE_CHANNELS = ['POS', 'BACK_OFFICE', 'ONLINE'] as const;
export type SaleChannel = (typeof SALE_CHANNELS)[number];

export const PAYMENT_METHODS = [
  'CASH',
  'MPESA',
  'CARD',
  'BANK_TRANSFER',
  'CHEQUE',
  'CREDIT',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// ─── Core list shape (returned by findAll include) ───────────────────────────

export interface Sale {
  id: string;
  receiptNumber: string;
  status: SaleStatus;
  channel: SaleChannel;
  currency: string;
  subtotal: string | number;
  discountAmount: string | number;
  taxRate: string | number;
  taxAmount: string | number;
  totalAmount: string | number;
  amountPaid: string | number;
  amountDue: string | number;
  notes: string | null;
  soldAt: string;
  voidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations included by findAll
  customer: { id: string; name: string; phone: string | null } | null;
  cashier: { id: string; firstName: string; lastName: string } | null;
  _count: { lineItems: number };
}

// ─── Detail shape (returned by findById) ─────────────────────────────────────

export interface SaleLineItem {
  id: string;
  itemId: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  unitPrice: string | number;
  discount: string | number;
  lineTotal: string | number;
}

export interface SalePayment {
  id: string;
  method: PaymentMethod;
  amount: string | number;
  reference: string | null;
  paidAt: string;
}

export interface SaleDetail extends Sale {
  lineItems: SaleLineItem[];
  payments: SalePayment[];
}

// ─── Summary shapes ───────────────────────────────────────────────────────────

export interface TodaySummary {
  date: string;
  todayTotal: string;
  averageSale: string;
  saleCount: number;
  amountCollected: string;
  amountOnCredit: string;
}

export interface RevenueSummary {
  from: string;
  to: string;
  totalRevenue: string;
  totalCollected: string;
  totalOnCredit: string;
  transactionCount: number;
  averageSale: string;
}

export interface MonthlyRevenueBucket {
  month: string; // e.g. "2026-08"
  totalRevenue: string;
  transactionCount: number;
}

// ─── Mutation payloads ────────────────────────────────────────────────────────

export interface CreateSaleLineItem {
  itemId?: string;
  name?: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
}

export interface CreateSalePayment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  paidAt?: string;
}

export interface CreateSalePayload {
  branchId: string;
  customerId?: string;
  channel?: SaleChannel;
  items: CreateSaleLineItem[];
  payments?: CreateSalePayment[];
  discountAmount?: number;
  taxRate?: number;
  dueDate?: string;
  soldAt?: string;
  notes?: string;
}

export interface VoidSalePayload {
  branchId: string;
  reason: string;
  refund?: boolean;
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface SalesQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: SaleStatus | '';
  channel?: SaleChannel | '';
  customerId?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useErpContext() {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const branchId = useBranchStore((s) => s.activeBranchId);
  return { orgId, accessToken, branchId };
}

// ─── List hook ────────────────────────────────────────────────────────────────

export function useSales(params?: SalesQueryParams) {
  // Strip empty strings so they don't reach the backend as ?status=
  const cleaned: Record<string, unknown> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== '' && v !== undefined && v !== null) cleaned[k] = v;
    }
  }
  return useErpList<Sale>('erp/sales', cleaned);
}

// ─── Single-sale hook ─────────────────────────────────────────────────────────

export function useSale(id: string | null) {
  const { orgId, accessToken, branchId } = useErpContext();
  return useQuery<SaleDetail>({
    queryKey: QK.sales.detail(orgId ?? '', branchId ?? '', id ?? ''),
    queryFn: () =>
      get<SaleDetail>(`/organizations/${orgId}/erp/sales/${id}`, {
        params: { branchId },
      }).then((r) => r.data),
    enabled: !!accessToken && !!orgId && !!branchId && !!id,
    staleTime: 30_000,
  });
}

// ─── Today summary ────────────────────────────────────────────────────────────

export function useTodaySalesSummary() {
  const { orgId, accessToken, branchId } = useErpContext();
  return useQuery<TodaySummary>({
    queryKey: QK.sales.todaySummary(orgId ?? '', branchId ?? ''),
    queryFn: () =>
      get<TodaySummary>(`/organizations/${orgId}/erp/sales/today-summary`, {
        params: { branchId },
      }).then((r) => r.data),
    enabled: !!accessToken && !!orgId && !!branchId,
    staleTime: 60_000,
    refetchInterval: 120_000, // auto-refresh every 2 min
  });
}

// ─── Revenue summary (arbitrary date range) ───────────────────────────────────

export function useRevenueSummary(params?: { from?: string; to?: string }) {
  const { orgId, accessToken, branchId } = useErpContext();
  return useQuery<RevenueSummary>({
    queryKey: QK.sales.revenueSummary(orgId ?? '', branchId ?? '', params),
    queryFn: () =>
      get<RevenueSummary>(`/organizations/${orgId}/erp/sales/revenue-summary`, {
        params: { branchId, ...params },
      }).then((r) => r.data),
    enabled: !!accessToken && !!orgId && !!branchId,
    staleTime: 2 * 60_000,
  });
}

// ─── Monthly revenue chart data ───────────────────────────────────────────────

export function useMonthlyRevenue(params?: { months?: number }) {
  const { orgId, accessToken, branchId } = useErpContext();
  return useQuery<MonthlyRevenueBucket[]>({
    queryKey: QK.sales.monthlyRevenue(orgId ?? '', branchId ?? '', params),
    queryFn: () =>
      get<MonthlyRevenueBucket[]>(
        `/organizations/${orgId}/erp/sales/monthly-revenue`,
        { params: { branchId, ...params } },
      ).then((r) => r.data),
    enabled: !!accessToken && !!orgId && !!branchId,
    staleTime: 5 * 60_000,
  });
}

// ─── Create sale ──────────────────────────────────────────────────────────────

export function useCreateSale() {
  const qc = useQueryClient();
  const { orgId, branchId } = useErpContext();
  return useMutation({
    mutationFn: (payload: CreateSalePayload) =>
      post<SaleDetail>(`/organizations/${orgId}/erp/sales`, payload).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ['erp', orgId, branchId, 'erp/sales'],
      });
      void qc.invalidateQueries({
        queryKey: QK.sales.todaySummary(orgId ?? '', branchId ?? ''),
      });
    },
  });
}

// ─── Void / refund sale ───────────────────────────────────────────────────────

export function useVoidSale(saleId: string) {
  const qc = useQueryClient();
  const { orgId, branchId } = useErpContext();
  return useMutation({
    mutationFn: (payload: VoidSalePayload) =>
      post<SaleDetail>(
        `/organizations/${orgId}/erp/sales/${saleId}/void`,
        payload,
      ).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ['erp', orgId, branchId, 'erp/sales'],
      });
      void qc.invalidateQueries({
        queryKey: QK.sales.detail(orgId ?? '', branchId ?? '', saleId),
      });
      void qc.invalidateQueries({
        queryKey: QK.sales.todaySummary(orgId ?? '', branchId ?? ''),
      });
    },
  });
}
