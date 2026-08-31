'use client';

import { useErpList, useErpResource } from './use-erp';

export interface Sale {
  id: string;
  reference?: string;
  customerName?: string | null;
  totalAmount: number | string;
  paidAmount?: number | string;
  status?: string;
  createdAt: string;
  itemCount?: number;
}

export interface TodaySalesSummary {
  totalAmount: number | string;
  averageSale: number | string;
  salesCount: number;
}

export function useSales(params?: Record<string, unknown>) {
  return useErpList<Sale>('erp/sales', params);
}

export function useTodaySalesSummary() {
  return useErpResource<TodaySalesSummary>('erp/sales/today-summary');
}
