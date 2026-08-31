'use client';

import { useErpList, useErpResource } from './use-erp';

export interface Expense {
  id: string;
  reference?: string;
  categoryName?: string;
  amount: number | string;
  description?: string;
  incurredAt: string;
}

export interface ExpenseStats {
  totalAmount: number | string;
  recordsCount: number;
}

export function useExpenses(params?: Record<string, unknown>) {
  return useErpList<Expense>('erp/expenses', params);
}

export function useExpenseStats() {
  return useErpResource<ExpenseStats>('erp/expenses/stats');
}

export function useExpenseCategories() {
  return useErpList('erp/expenses/categories');
}
