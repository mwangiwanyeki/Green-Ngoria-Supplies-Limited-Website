'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch } from '../api-client';
import { QK } from '../query-keys';

/**
 * Mining sites are a top-level resource (`/mining-sites`), not organization
 * scoped — see `src/module/mining-sites/mining-sites.controller.ts`.
 */
export function useMiningSites<T = unknown>(params?: object) {
  return useQuery({
    queryKey: QK.miningSites.all(params),
    queryFn: () => get<T[]>('/mining-sites', { params }).then((r) => r),
  });
}

export function useMiningSite(id: string) {
  return useQuery({
    queryKey: QK.miningSites.detail(id),
    queryFn: () => get(`/mining-sites/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateMiningSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post('/mining-sites', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mining-sites'] }),
  });
}

/**
 * PATCH /mining-sites/:id — the backend binds the full `CreateMiningSiteDto`,
 * so `name` must always be present in the payload.
 */
export function useUpdateMiningSite(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      patch(`/mining-sites/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.miningSites.detail(id) });
      // Invalidate all mining-sites list queries regardless of params
      void qc.invalidateQueries({ queryKey: ['mining-sites'] });
    },
  });
}
