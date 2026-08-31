'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch } from '../api-client';
import { QK } from '../query-keys';
import type { LeadSummary } from '../models';

export function useLeads<T = LeadSummary>(orgId: string, params?: object) {
  return useQuery({
    queryKey: QK.leads.all(orgId, params),
    queryFn: () =>
      get<T[]>(`/organizations/${orgId}/leads`, { params }).then((r) => r),
    enabled: !!orgId,
  });
}

export function useLead(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.leads.detail(orgId, id),
    queryFn: () =>
      get(`/organizations/${orgId}/leads/${id}`).then((r) => r.data),
    enabled: !!orgId && !!id,
  });
}

export function useLeadPipeline(orgId: string) {
  return useQuery({
    queryKey: QK.leads.pipeline(orgId),
    queryFn: () =>
      get(`/organizations/${orgId}/leads/pipeline`).then((r) => r.data),
    enabled: !!orgId,
  });
}

export function useCreateLead(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/leads`, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.leads.all(orgId) });
      void qc.invalidateQueries({ queryKey: QK.leads.pipeline(orgId) });
    },
  });
}

export function useUpdateLead(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      patch(`/organizations/${orgId}/leads/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.leads.detail(orgId, id) });
      void qc.invalidateQueries({ queryKey: QK.leads.all(orgId) });
      void qc.invalidateQueries({ queryKey: QK.leads.pipeline(orgId) });
    },
  });
}
