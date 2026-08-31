'use client';

import { useErpList, useErpResource } from './use-erp';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  categoryId?: string | null;
  categoryName?: string | null;
  unitPrice?: number | string;
  quantity?: number;
  reorderLevel?: number;
  storeId?: string | null;
}

export interface InventoryStats {
  totalValue: number | string;
  inStock: number;
  outOfStock: number;
  lowStock: number;
  totalItems: number;
}

export function useInventoryItems(params?: {
  search?: string;
  filter?: 'all' | 'low' | 'out';
  page?: number;
  limit?: number;
}) {
  return useErpList<InventoryItem>('erp/inventory/items', params);
}

export function useInventoryStats() {
  return useErpResource<InventoryStats>('erp/inventory/stats');
}

export function useInventoryCategories() {
  return useErpList('erp/inventory/categories');
}

export function useInventoryStores() {
  return useErpList('erp/inventory/stores');
}
