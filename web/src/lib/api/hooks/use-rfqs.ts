'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '../api-client';
import { QK } from '../query-keys';

export function useRfqs(orgId: string, params?: object) {
  return useQuery({
    queryKey: QK.rfqs.all(orgId, params),
    queryFn: () => get(`/organizations/${orgId}/rfqs`, { params }),
    enabled: !!orgId,
  });
}

export function useRfq(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.rfqs.detail(orgId, id),
    queryFn: () =>
      get(`/organizations/${orgId}/rfqs/${id}`).then((r) => r.data),
    enabled: !!orgId && !!id,
  });
}

export function useCreateRfq(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/rfqs`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.rfqs.all(orgId) }),
  });
}

export function useSubmitRfq(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      post(`/organizations/${orgId}/rfqs/${id}/submit`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.rfqs.detail(orgId, id) });
      void qc.invalidateQueries({ queryKey: QK.rfqs.all(orgId) });
    },
  });
}

export function useCancelRfq(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      post(`/organizations/${orgId}/rfqs/${id}/cancel`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.rfqs.all(orgId) }),
  });
}
