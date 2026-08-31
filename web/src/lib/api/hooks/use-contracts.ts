'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '../api-client';

export function useContracts<T = unknown>(orgId: string, params?: object) {
  return useQuery({
    queryKey: ['orgs', orgId, 'contracts', params],
    queryFn: () =>
      get<T[]>(`/organizations/${orgId}/contracts`, { params }).then((r) => r),
    enabled: !!orgId,
  });
}

export function useContract(orgId: string, id: string) {
  return useQuery({
    queryKey: ['orgs', orgId, 'contracts', id],
    queryFn: () =>
      get(`/organizations/${orgId}/contracts/${id}`).then((r) => r.data),
    enabled: !!orgId && !!id,
  });
}

export function useCreateContract(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/contracts`, data).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['orgs', orgId, 'contracts'] }),
  });
}

export function useTransitionContract(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      post(`/organizations/${orgId}/contracts/${id}/transition`, {
        status,
      }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ['orgs', orgId, 'contracts', id],
      });
      void qc.invalidateQueries({ queryKey: ['orgs', orgId, 'contracts'] });
    },
  });
}
