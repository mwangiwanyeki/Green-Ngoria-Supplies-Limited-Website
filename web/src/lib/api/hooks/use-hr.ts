'use client';

import { useErpList, useErpResource } from './use-erp';

export interface StaffMember {
  id: string;
  fullName: string;
  role?: string;
  department?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'on-leave';
  hireDate?: string;
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  period: string;
  grossPay: number | string;
  netPay: number | string;
  status?: 'draft' | 'approved' | 'paid';
  paidAt?: string | null;
}

export interface LeaveRequest {
  id: string;
  staffName: string;
  leaveType?: string;
  startDate: string;
  endDate: string;
  status?: 'pending' | 'approved' | 'denied' | 'overdue';
  reason?: string;
}

export interface HrOverview {
  totalStaff: number;
  activeStaff: number;
  onLeave: number;
  usersCount: number;
}

export function useHrStaff(params?: Record<string, unknown>) {
  return useErpList<StaffMember>('hr/staff', params);
}

export function useHrOverview() {
  return useErpResource<HrOverview>('hr/overview');
}

export function useHrPayroll(params?: Record<string, unknown>) {
  return useErpList<PayrollRecord>('hr/payroll', params);
}

export function useHrLeave(params?: Record<string, unknown>) {
  return useErpList<LeaveRequest>('hr/leave', params);
}
