'use client';

import { useErpList, useErpResource } from './use-erp';

export interface VatLeachRental {
  id: string;
  renterName: string;
  vatCode?: string;
  phone?: string | null;
  location?: string | null;
  status?: 'active' | 'completed' | 'overdue';
  depositAmount?: number | string;
  balanceDue?: number | string;
  startDate?: string;
  endDate?: string | null;
}

export interface VatLeachStats {
  depositsHeld: number | string;
  activeRentals: number;
  overdueCount: number;
}

export function useVatLeachRentals(params?: Record<string, unknown>) {
  return useErpList<VatLeachRental>('vat-leach/rentals', params);
}

export function useVatLeachStats() {
  return useErpResource<VatLeachStats>('vat-leach/stats');
}

export function useVatLeachReminders() {
  return useErpList('vat-leach/reminders');
}

export function useVatLeachPayments() {
  return useErpList('vat-leach/payments');
}

export function useVatLeachUnits(params?: Record<string, unknown>) {
  return useErpList('vat-leach/units', params);
}
