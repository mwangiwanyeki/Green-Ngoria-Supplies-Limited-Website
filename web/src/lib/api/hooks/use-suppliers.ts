'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post, patch } from '../api-client';
import { useAuthStore } from '@/stores/auth-store';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  country?: string | null;
  address?: string | null;
  taxPin?: string | null;
  website?: string | null;
  specializations?: string[];
  notes?: string | null;
  category?: string | null;
  isApproved?: boolean;
  createdAt: string;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateSupplierPayload {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  country?: string;
  address?: string;
  taxPin?: string;
  website?: string;
  specializations?: string[];
  notes?: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

function useOrgId() {
  return useAuthStore((s) => s.user?.organizationId);
}

function useAccessToken() {
  return useAuthStore((s) => s.accessToken);
}

const BASE = (orgId: string) => `/organizations/${orgId}/procurement/vendors`;

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Procurement vendors — uses plain useQuery (NOT useErpList) because
 * the backend uses PaginationDto (no branchId). Injecting branchId causes 400.
 */
export function useSuppliers(params?: Record<string, unknown>) {
  const orgId = useOrgId();
  const accessToken = useAccessToken();
  return useQuery({
    queryKey: ['orgs', orgId, 'procurement', 'vendors', params ?? {}],
    queryFn: () =>
      get(`${BASE(orgId!)}`, { params }),
    enabled: !!accessToken && !!orgId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateSupplier() {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: CreateSupplierPayload) =>
      post(`${BASE(orgId!)}`, p).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orgs', orgId, 'procurement', 'vendors'] });
    },
  });
}

export function useUpdateSupplier(vendorId: string) {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<CreateSupplierPayload>) =>
      patch(`${BASE(orgId!)}/${vendorId}`, p).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orgs', orgId, 'procurement', 'vendors'] });
    },
  });
}

export function useApproveSupplier(vendorId: string) {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      post(`${BASE(orgId!)}/${vendorId}/approve`, {}).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orgs', orgId, 'procurement', 'vendors'] });
    },
  });
}
