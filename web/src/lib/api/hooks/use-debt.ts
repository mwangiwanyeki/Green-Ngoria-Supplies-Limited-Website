'use client';

import { useErpList, useErpResource } from './use-erp';

export interface DebtAccount {
  id: string;
  customerName: string;
  outstanding: number | string;
  overdueDays?: number;
  status?: 'current' | 'overdue' | 'settled';
  lastPaymentAt?: string | null;
}

export interface DebtStats {
  totalOutstanding: number | string;
  overdueCount: number;
  customerCount: number;
}

export function useDebtAccounts(params?: Record<string, unknown>) {
  return useErpList<DebtAccount>('erp/debt/accounts', params);
}

export function useDebtStats() {
  return useErpResource<DebtStats>('erp/debt/stats');
}
