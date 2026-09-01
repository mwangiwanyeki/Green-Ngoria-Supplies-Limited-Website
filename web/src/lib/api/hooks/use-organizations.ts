'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch } from '../api-client';
import { QK } from '../query-keys';

/**
 * Organizations are top-level (`/organizations`), not org-scoped. Client
 * organizations are created here — `src/module/clients` creates *Client*
 * records inside an organization, which is a different resource.
 */
export function useOrganizations<T = unknown>(params?: object) {
  return useQuery({
    queryKey: [...QK.orgs.all(), params ?? {}],
    queryFn: () => get<T[]>('/organizations', { params }).then((r) => r),
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: QK.orgs.detail(id),
    queryFn: () => get(`/organizations/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post('/organizations', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.orgs.all() }),
  });
}

export function useUpdateOrganization(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      patch(`/organizations/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.orgs.detail(id) });
      void qc.invalidateQueries({ queryKey: QK.orgs.all() });
    },
  });
}
