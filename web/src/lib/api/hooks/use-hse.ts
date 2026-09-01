'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '../api-client';
import { QK } from '../query-keys';

export function useHseIncidents(orgId: string, params?: object) {
  return useQuery({
    queryKey: QK.hseIncidents.all(orgId, params),
    queryFn: () => get(`/organizations/${orgId}/hse/incidents`, { params }),
    enabled: !!orgId,
  });
}

export function useHseIncident(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.hseIncidents.detail(orgId, id),
    queryFn: () =>
      get(`/organizations/${orgId}/hse/incidents/${id}`).then((r) => r.data),
    enabled: !!orgId && !!id,
  });
}

export function useHseDashboard(orgId: string) {
  return useQuery({
    queryKey: ['orgs', orgId, 'hse', 'dashboard'],
    queryFn: () =>
      get(`/organizations/${orgId}/hse/dashboard`).then((r) => r.data),
    enabled: !!orgId,
  });
}

export function useCreateHseIncident(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/hse/incidents`, data).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.hseIncidents.all(orgId) }),
  });
}

export function useCloseHseIncident(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      post(`/organizations/${orgId}/hse/incidents/${id}/close`).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: QK.hseIncidents.detail(orgId, id),
      });
      void qc.invalidateQueries({ queryKey: QK.hseIncidents.all(orgId) });
    },
  });
}

/**
 * List-friendly variant of `useCloseHseIncident` — takes the incident id as a
 * mutation variable so a single instance can serve every row in a table.
 */
export function useCloseIncident(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      post(`/organizations/${orgId}/hse/incidents/${id}/close`).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.hseIncidents.all(orgId) });
      void qc.invalidateQueries({
        queryKey: ['orgs', orgId, 'hse', 'dashboard'],
      });
    },
  });
}
