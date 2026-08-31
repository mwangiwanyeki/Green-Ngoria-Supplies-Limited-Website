'use client';

import { useErpList } from './use-erp';

export interface ErpCustomer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  balance?: number | string;
  totalPurchases?: number | string;
  createdAt: string;
}

export function useErpCustomers(params?: Record<string, unknown>) {
  return useErpList<ErpCustomer>('erp/customers', params);
}
