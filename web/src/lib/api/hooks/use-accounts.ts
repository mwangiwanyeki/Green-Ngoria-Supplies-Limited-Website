'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from '../api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useBranchStore } from '@/stores/branch-store';
import { useErpList, useErpResource } from './use-erp';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ACCOUNT_TYPES = [
  'CASH', 'BANK', 'MOBILE_MONEY', 'PETTY_CASH',
  'RECEIVABLE', 'PAYABLE', 'EQUITY', 'REVENUE', 'EXPENSE',
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: 'Cash',
  BANK: 'Bank',
  MOBILE_MONEY: 'Mobile Money',
  PETTY_CASH: 'Petty Cash',
  RECEIVABLE: 'Receivable',
  PAYABLE: 'Payable',
  EQUITY: 'Equity',
  REVENUE: 'Revenue',
  EXPENSE: 'Expense',
};

export const TRANSACTION_TYPES = ['CREDIT', 'DEBIT'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Account {
  id: string;
  name: string;
  code?: string | null;
  type?: AccountType | string;
  balance: number | string;
  /** backend returns currentBalance, frontend may use either name */
  currentBalance?: number | string;
  currency?: string;
  accountNumber?: string | null;
  provider?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface AccountTransaction {
  id: string;
  type: TransactionType;
  amount: string | number;
  description: string;
  reference?: string | null;
  balanceAfter: string | number;
  occurredAt: string;
  isManualEntry?: boolean;
}

export interface AccountsSummary {
  totalBalance: string | number;
  accountCount: number;
  byType?: { type: string; balance: string | number }[];
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateAccountPayload {
  branchId: string;
  name: string;
  type: AccountType;
  accountNumber?: string;
  provider?: string;
  currency?: string;
  openingBalance?: number;
  isActive?: boolean;
  description?: string;
}

export interface ManualEntryPayload {
  branchId: string;
  type: TransactionType;
  amount: number;
  description: string;
  reference?: string;
  occurredAt?: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

function useCtx() {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const branchId = useBranchStore((s) => s.activeBranchId);
  return { orgId, accessToken, branchId };
}

const BASE = (orgId: string) => `/organizations/${orgId}/erp/accounts`;

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAccounts(params?: Record<string, unknown>) {
  return useErpList<Account>('erp/accounts', params);
}

export function useAccountsSummary() {
  return useErpResource<AccountsSummary>('erp/accounts/summary');
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateAccount() {
  const { orgId, branchId } = useCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: CreateAccountPayload) =>
      post(`${BASE(orgId!)}`, p).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['erp', orgId, branchId, 'erp/accounts'] });
      void qc.invalidateQueries({ queryKey: ['erp', orgId, branchId, 'erp/accounts/summary', 'one', {}] });
    },
  });
}

export function useUpdateAccount(accountId: string) {
  const { orgId, branchId } = useCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<CreateAccountPayload>) =>
      patch(`${BASE(orgId!)}/${accountId}`, p).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['erp', orgId, branchId, 'erp/accounts'] });
    },
  });
}

export function useManualEntry(accountId: string) {
  const { orgId, branchId } = useCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: ManualEntryPayload) =>
      post(`${BASE(orgId!)}/${accountId}/transactions`, p).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['erp', orgId, branchId, 'erp/accounts'] });
      void qc.invalidateQueries({ queryKey: ['erp', orgId, branchId, 'erp/accounts/summary', 'one', {}] });
    },
  });
}

export function useDeleteAccount() {
  const { orgId, branchId } = useCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, delBranchId }: { accountId: string; delBranchId: string }) =>
      del(`${BASE(orgId!)}/${accountId}?branchId=${delBranchId}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['erp', orgId, branchId, 'erp/accounts'] });
      void qc.invalidateQueries({ queryKey: ['erp', orgId, branchId, 'erp/accounts/summary', 'one', {}] });
    },
  });
}
