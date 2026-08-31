'use client';

import { useErpList } from './use-erp';

export interface Visitor {
  id: string;
  fullName: string;
  idNumber?: string;
  phone?: string;
  company?: string;
  purpose?: string;
  host?: string;
  checkInAt: string;
  checkOutAt?: string | null;
  status?: 'checked-in' | 'checked-out';
}

export function useVisitors(params?: Record<string, unknown>) {
  return useErpList<Visitor>('visitors', params);
}
