'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from '../api-client';
import { QK } from '../query-keys';

// ─── Equipment ────────────────────────────────────────────────────────────

export function useEquipmentCategories() {
  return useQuery({
    queryKey: QK.equipment.categories(),
    queryFn: () => get('/equipment/categories').then((r) => r.data),
    staleTime: 10 * 60_000,
  });
}

export function useEquipment(params?: object, adminMode = false) {
  return useQuery({
    queryKey: QK.equipment.all(params),
    queryFn: () =>
      get(adminMode ? '/equipment/admin' : '/equipment', { params }),
  });
}

export function useEquipmentItem(id: string) {
  return useQuery({
    queryKey: QK.equipment.detail(id),
    queryFn: () => get(`/equipment/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => post('/equipment', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  });
}

export function useUpdateEquipment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      patch(`/equipment/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.equipment.detail(id) });
      void qc.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
}

export function usePublishEquipment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post(`/equipment/${id}/publish`).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.equipment.detail(id) }),
  });
}

// ─── Spare parts ──────────────────────────────────────────────────────────

export function useSpares(params?: object) {
  return useQuery({
    queryKey: QK.spares.all(params),
    queryFn: () => get('/equipment/spares', { params }),
  });
}

export function useSpare(id: string) {
  return useQuery({
    queryKey: QK.spares.detail(id),
    queryFn: () => get(`/equipment/spares/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateSpare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post('/equipment/spares', data).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['equipment', 'spares'] }),
  });
}

/**
 * PATCH /equipment/spares/:id — the backend binds the full
 * `CreateSparePartDto`, so `sku` and `name` must always be present.
 */
export function useUpdateSpare(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      patch(`/equipment/spares/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.spares.detail(id) });
      void qc.invalidateQueries({ queryKey: ['equipment', 'spares'] });
    },
  });
}

export function useAdjustStock(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      adjustment,
      reason,
    }: {
      adjustment: number;
      reason: string;
    }) =>
      post(`/equipment/spares/${id}/stock-adjust`, { adjustment, reason }).then(
        (r) => r.data,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.spares.detail(id) }),
  });
}

// ─── List-friendly equipment mutations ────────────────────────────────────
// These take the equipment id as a mutation variable so one hook instance can
// serve every row of the catalogue table.

export function useUpdateEquipmentById() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      patch(`/equipment/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  });
}

export function useSetEquipmentPublished() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      post(`/equipment/${id}/${published ? 'publish' : 'unpublish'}`).then(
        (r) => r.data,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  });
}

/** Archives (soft-deletes) a catalogue item. */
export function useDeleteEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/equipment/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  });
}
