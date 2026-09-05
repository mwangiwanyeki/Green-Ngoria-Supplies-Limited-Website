'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch, del } from '../api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useErpList, useErpResource } from './use-erp';

// ─── Enums (mirror Prisma exactly — uppercase) ────────────────────────────────

export const STAFF_STATUSES = [
  'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'PROBATION',
] as const;
export type StaffStatus = (typeof STAFF_STATUSES)[number];

export const EMPLOYMENT_TYPES = [
  'PERMANENT', 'CONTRACT', 'CASUAL', 'INTERN', 'CONSULTANT',
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const PAYMENT_TERMS = [
  'MONTHLY', 'BIWEEKLY', 'WEEKLY', 'DAILY', 'PER_TASK',
] as const;
export type StaffPaymentTerms = (typeof PAYMENT_TERMS)[number];

export const LEAVE_TYPES = [
  'ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'COMPASSIONATE',
  'UNPAID', 'STUDY', 'OTHER',
] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_STATUSES = [
  'PENDING', 'APPROVED', 'DENIED', 'CANCELLED', 'OVERDUE',
] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const PAYROLL_STATUSES = [
  'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'CANCELLED',
] as const;
export type PayrollRunStatus = (typeof PAYROLL_STATUSES)[number];

export const HR_CURRENCIES = ['USD', 'KES', 'TZS', 'UGX', 'RWF', 'EUR', 'GBP'] as const;
export type HrCurrency = (typeof HR_CURRENCIES)[number];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  staffNumber: string;
  firstName: string;
  lastName: string;
  /** Convenience computed field — `${firstName} ${lastName}` */
  fullName?: string;
  position?: string | null;
  department?: string | null;
  phone?: string | null;
  email?: string | null;
  idNumber?: string | null;
  status: StaffStatus;
  employmentType?: EmploymentType;
  paymentTerms?: StaffPaymentTerms;
  baseSalary?: string | number | null;
  currency?: HrCurrency;
  hireDate?: string | null;
  notes?: string | null;
}

export interface PayrollRun {
  id: string;
  reference?: string;
  periodMonth: number;
  periodYear: number;
  status: PayrollRunStatus;
  totalGross?: string | number;
  totalNet?: string | number;
  totalDeductions?: string | number;
  staffCount?: number;
  currency?: string;
  createdAt: string;
  _count?: { entries: number };
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName?: string;
  staff?: { id: string; firstName: string; lastName: string } | null;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  reason?: string | null;
  reviewComments?: string | null;
  createdAt: string;
}

export interface HrOverview {
  totalStaff: number;
  headcount: number;
  checkedInToday: number;
  onLeaveNow: number;
  newThisMonth: number;
  linkedUsers: number;
  byStatus: Record<string, number>;
  byDepartment: Record<string, number>;
  byEmploymentType: Record<string, number>;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateStaffPayload {
  branchId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  idNumber?: string;
  address?: string;
  position?: string;
  department?: string;
  employmentType?: EmploymentType;
  paymentTerms?: StaffPaymentTerms;
  status?: StaffStatus;
  baseSalary?: number;
  currency?: HrCurrency;
  hireDate?: string;
  notes?: string;
}

export interface CreatePayrollRunPayload {
  branchId: string;
  periodMonth: number;
  periodYear: number;
  currency?: HrCurrency;
  notes?: string;
}

export interface CreateLeavePayload {
  branchId: string;
  staffId: string;
  type?: LeaveType;
  startDate: string;
  endDate: string;
  days?: number;
  reason?: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

function useOrgId() {
  return useAuthStore((s) => s.user?.organizationId) ?? '';
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useHrOverview() {
  return useErpResource<HrOverview>('hr/overview');
}

export function useHrStaff(params?: Record<string, unknown>) {
  return useErpList<StaffMember>('hr/staff', params);
}

export function useHrPayroll(params?: Record<string, unknown>) {
  return useErpList<PayrollRun>('hr/payroll', params);
}

export function useHrLeave(params?: Record<string, unknown>) {
  return useErpList<LeaveRequest>('hr/leave', params);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateStaff() {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStaffPayload) =>
      post(`/organizations/${orgId}/hr/staff`, payload).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['erp', orgId] });
    },
  });
}

export function useTerminateStaff(staffId: string, branchId: string) {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      del(
        `/organizations/${orgId}/hr/branches/${branchId}/staff/${staffId}`,
      ).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['erp', orgId] });
    },
  });
}

export function useCreatePayrollRun() {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePayrollRunPayload) =>
      post(`/organizations/${orgId}/hr/payroll`, payload).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['erp', orgId] });
    },
  });
}

export function useCreateLeaveRequest() {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeavePayload) =>
      post(`/organizations/${orgId}/hr/leave`, payload).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['erp', orgId] });
    },
  });
}

export function useReviewLeaveRequest(requestId: string) {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      status,
      comments,
    }: {
      status: 'APPROVED' | 'DENIED';
      comments?: string;
    }) =>
      post(`/organizations/${orgId}/hr/leave/${requestId}/review`, {
        status,
        comments,
      }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['erp', orgId] });
    },
  });
}
