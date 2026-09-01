'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, del } from '../api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useBranchStore } from '@/stores/branch-store';
import { useErpList, useErpResource } from './use-erp';

// ─── Enums (mirror Prisma PaymentMethod) ─────────────────────────────────────

export const EXPENSE_PAYMENT_METHODS = [
  'CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHEQUE', 'OTHER',
] as const;
export type ExpensePaymentMethod = (typeof EXPENSE_PAYMENT_METHODS)[number];

export const EXPENSE_PAYMENT_METHOD_LABELS: Record<ExpensePaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  MOBILE_MONEY: 'Mobile Money',
  CHEQUE: 'Cheque',
  OTHER: 'Other',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  reference?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  accountId?: string | null;
  accountName?: string | null;
  amount: number | string;
  description?: string;
  method?: string;
  currency?: string;
  incurredAt: string;
  category?: { id: string; name: string } | null;
  account?: { id: string; name: string } | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  _count?: { expenses: number };
}

export interface ExpenseStats {
  totalExpenses: string | number;
  recordCount: number;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateExpensePayload {
  branchId: string;
  description: string;
  amount: number;
  categoryId?: string;
  accountId?: string;
  currency?: string;
  method?: ExpensePaymentMethod;
  receiptUrl?: string;
  incurredAt?: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

function useCtx() {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const branchId = useBranchStore((s) => s.activeBranchId);
  return { orgId, branchId };
}

const BASE = (orgId: string) => `/organizations/${orgId}/erp/expenses`;

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useExpenses(params?: Record<string, unknown>) {
  return useErpList<Expense>('erp/expenses', params);
}

export function useExpenseStats() {
  return useErpResource<ExpenseStats>('erp/expenses/stats');
}

export function useExpenseCategories(params?: Record<string, unknown>) {
  return useErpList<ExpenseCategory>('erp/expenses/categories', params);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateExpense() {
  const { orgId, branchId } = useCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: CreateExpensePayload) =>
      post(`${BASE(orgId!)}`, p).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['erp', orgId, branchId, 'erp/expenses'] });
      void qc.invalidateQueries({ queryKey: ['erp', orgId, branchId, 'erp/expenses/stats', 'one', {}] });
    },
  });
}

export function useDeleteExpense() {
  const { orgId, branchId } = useCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, delBranchId }: { expenseId: string; delBranchId: string }) =>
      del(`${BASE(orgId!)}/${expenseId}?branchId=${delBranchId}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['erp', orgId, branchId, 'erp/expenses'] });
      void qc.invalidateQueries({ queryKey: ['erp', orgId, branchId, 'erp/expenses/stats', 'one', {}] });
    },
  });
}
