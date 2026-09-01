'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch } from '../api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useBranchStore } from '@/stores/branch-store';
import { useErpList, useErpResource } from './use-erp';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const DEBT_PAYMENT_METHODS = [
  'CASH',
  'BANK_TRANSFER',
  'MOBILE_MONEY',
  'CHEQUE',
  'OTHER',
] as const;
export type DebtPaymentMethod = (typeof DEBT_PAYMENT_METHODS)[number];

export const DEBT_PAYMENT_METHOD_LABELS: Record<DebtPaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  MOBILE_MONEY: 'Mobile Money',
  CHEQUE: 'Cheque',
  OTHER: 'Other',
};

export const DEBT_STATUSES = [
  'CURRENT',
  'OVERDUE',
  'SETTLED',
  'WRITTEN_OFF',
  'SUSPENDED',
] as const;
export type DebtStatus = (typeof DEBT_STATUSES)[number];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DebtAccount {
  id: string;
  customerId?: string;
  customerName: string;
  outstanding: number | string;
  totalBilled?: number | string;
  totalPaid?: number | string;
  creditLimit?: number | string;
  overdueDays?: number;
  dueDate?: string | null;
  status?: DebtStatus;
  lastPaymentAt?: string | null;
  notes?: string | null;
}

export interface DebtStats {
  totalOutstanding: number | string;
  overdueCount: number;
  customerCount: number;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface RecordDebtPaymentPayload {
  branchId: string;
  amount: number;
  method: DebtPaymentMethod;
  reference?: string;
  notes?: string;
  paidAt?: string;
}

export interface UpdateDebtAccountPayload {
  branchId: string;
  creditLimit?: number;
  dueDate?: string;
  status?: DebtStatus;
  notes?: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

function useCtx() {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const branchId = useBranchStore((s) => s.activeBranchId);
  return { orgId, branchId };
}

const BASE = (orgId: string) => `/organizations/${orgId}/erp/debt/accounts`;

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useDebtAccounts(params?: Record<string, unknown>) {
  return useErpList<DebtAccount>('erp/debt/accounts', params);
}

export function useDebtStats() {
  return useErpResource<DebtStats>('erp/debt/stats');
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useRecordDebtPayment(accountId: string) {
  const { orgId, branchId } = useCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: RecordDebtPaymentPayload) =>
      post(`${BASE(orgId!)}/${accountId}/payments`, p).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ['erp', orgId, branchId, 'erp/debt/accounts'],
      });
      void qc.invalidateQueries({
        queryKey: ['erp', orgId, branchId, 'erp/debt/stats', 'one', {}],
      });
    },
  });
}

export function useUpdateDebtAccount(accountId: string) {
  const { orgId, branchId } = useCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: UpdateDebtAccountPayload) =>
      patch(`${BASE(orgId!)}/${accountId}`, p).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ['erp', orgId, branchId, 'erp/debt/accounts'],
      });
    },
  });
}
