'use client';

import { useErpList, useErpResource } from './use-erp';

export interface Account {
  id: string;
  name: string;
  code?: string;
  type?: string;
  balance: number | string;
  currency?: string;
}

export interface AccountsSummary {
  totalBalance: number | string;
  accountsCount: number;
}

export function useAccounts(params?: Record<string, unknown>) {
  return useErpList<Account>('erp/accounts', params);
}

export function useAccountsSummary() {
  return useErpResource<AccountsSummary>('erp/accounts/summary');
}
