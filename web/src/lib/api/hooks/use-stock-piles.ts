'use client';

import { useErpList, useErpResource } from './use-erp';

export interface StockPile {
  id: string;
  name: string;
  location?: string;
  tonnage?: number | string;
  grade?: number | string;
  gradeUnit?: string;
  status?: string;
  updatedAt: string;
}

export interface StockPileStats {
  totalTonnage: number | string;
  pilesCount: number;
  averageGrade?: number | string;
}

export function useStockPiles(params?: Record<string, unknown>) {
  return useErpList<StockPile>('stock-piles', params);
}

export function useStockPileStats() {
  return useErpResource<StockPileStats>('stock-piles/stats');
}
