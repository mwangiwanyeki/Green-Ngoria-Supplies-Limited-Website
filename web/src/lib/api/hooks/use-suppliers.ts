'use client';

import { useErpList, useErpResource } from './use-erp';

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  categoryName?: string;
  createdAt: string;
}

export interface SupplierStats {
  totalOrders: number;
  orderValue: number | string;
  pendingOrders: number;
}

export function useSuppliers(params?: Record<string, unknown>) {
  return useErpList<Supplier>('procurement/vendors', params);
}

export function useSupplierStats() {
  return useErpResource<SupplierStats>('procurement/vendors/stats');
}
