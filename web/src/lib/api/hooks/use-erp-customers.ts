'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch, del } from '../api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useBranchStore } from '@/stores/branch-store';
import { useErpList } from './use-erp';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ErpCustomer {
  id: string;
  customerNumber?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  address?: string | null;
  notes?: string | null;
  balance?: number | string;
  totalPurchases?: number | string;
  createdAt: string;
  debtAccount?: {
    outstanding: string | number;
    status: string;
    dueDate?: string | null;
  } | null;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateCustomerPayload {
  branchId: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  address?: string;
  notes?: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

function useCtx() {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const branchId = useBranchStore((s) => s.activeBranchId);
  return { orgId, branchId };
}

const BASE = (orgId: string) => `/organizations/${orgId}/erp/customers`;

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useErpCustomers(params?: Record<string, unknown>) {
  return useErpList<ErpCustomer>('erp/customers', params);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateCustomer() {
  const { orgId, branchId } = useCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: CreateCustomerPayload) =>
      post(`${BASE(orgId!)}`, p).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['erp', orgId, branchId, 'erp/customers'] });
    },
  });
}

export function useUpdateCustomer(customerId: string) {
  const { orgId, branchId } = useCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<CreateCustomerPayload>) =>
      patch(`${BASE(orgId!)}/${customerId}`, p).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['erp', orgId, branchId, 'erp/customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const { orgId, branchId } = useCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, delBranchId }: { customerId: string; delBranchId: string }) =>
      del(`${BASE(orgId!)}/${customerId}?branchId=${delBranchId}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['erp', orgId, branchId, 'erp/customers'] });
    },
  });
}
