'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from '../api-client';
import { QK } from '../query-keys';

export function useClients<T = unknown>(orgId: string, params?: object) {
  return useQuery({
    queryKey: QK.clients.all(orgId, params),
    queryFn: () =>
      get<T[]>(`/organizations/${orgId}/clients`, { params }).then((r) => r),
    enabled: !!orgId,
  });
}

export function useClient(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.clients.detail(orgId, id),
    queryFn: () =>
      get(`/organizations/${orgId}/clients/${id}`).then((r) => r.data),
    enabled: !!orgId && !!id,
  });
}

export function useCreateClient(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/clients`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.clients.all(orgId) }),
  });
}

export function useUpdateClient(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      patch(`/organizations/${orgId}/clients/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.clients.detail(orgId, id) });
      void qc.invalidateQueries({ queryKey: QK.clients.all(orgId) });
    },
  });
}

/** Archives (soft-deletes) a client. */
export function useDeleteClient(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      del(`/organizations/${orgId}/clients/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.clients.all(orgId) }),
  });
}

export function useAddContact(orgId: string, clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/clients/${clientId}/contacts`, data).then(
        (r) => r.data,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.clients.detail(orgId, clientId) }),
  });
}
