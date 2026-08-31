'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '../api-client';
import { QK } from '../query-keys';

// ─── Assets ───────────────────────────────────────────────────────────────

export function useAssets<T = unknown>(orgId: string, params?: object) {
  return useQuery({
    queryKey: QK.assets.all(orgId, params),
    queryFn: () =>
      get<T[]>(`/organizations/${orgId}/assets`, { params }).then((r) => r),
    enabled: !!orgId,
  });
}

export function useAsset(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.assets.detail(orgId, id),
    queryFn: () =>
      get(`/organizations/${orgId}/assets/${id}`).then((r) => r.data),
    enabled: !!orgId && !!id,
  });
}

export function useCreateAsset(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/assets`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.assets.all(orgId) }),
  });
}

export function useExpiringWarranties(orgId: string) {
  return useQuery({
    queryKey: ['orgs', orgId, 'assets', 'warranties', 'expiring'],
    queryFn: () =>
      get(`/organizations/${orgId}/assets/warranties/expiring`).then(
        (r) => r.data,
      ),
    enabled: !!orgId,
  });
}

// ─── Work orders ──────────────────────────────────────────────────────────

export function useWorkOrders(orgId: string, params?: object) {
  return useQuery({
    queryKey: QK.workOrders.all(orgId, params),
    queryFn: () =>
      get(`/organizations/${orgId}/assets/work-orders/list`, { params }),
    enabled: !!orgId,
  });
}

export function useCreateWorkOrder(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/assets/work-orders`, data).then(
        (r) => r.data,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.workOrders.all(orgId) }),
  });
}

export function useTransitionWorkOrder(orgId: string, woId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { status: string; completionNotes?: string }) =>
      post(
        `/organizations/${orgId}/assets/work-orders/${woId}/transition`,
        data,
      ).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.workOrders.all(orgId) });
      void qc.invalidateQueries({
        queryKey: QK.workOrders.detail(orgId, woId),
      });
    },
  });
}
