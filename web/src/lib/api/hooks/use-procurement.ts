'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch } from '../api-client';
import { QK } from '../query-keys';

// ─── Vendors ──────────────────────────────────────────────────────────────

export function useVendors(orgId: string, params?: object) {
  return useQuery({
    queryKey: QK.vendors.all(orgId, params),
    queryFn: () =>
      get(`/organizations/${orgId}/procurement/vendors`, { params }),
    enabled: !!orgId,
  });
}

export function useVendor(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.vendors.detail(orgId, id),
    queryFn: () =>
      get(`/organizations/${orgId}/procurement/vendors/${id}`).then(
        (r) => r.data,
      ),
    enabled: !!orgId && !!id,
  });
}

export function useCreateVendor(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/procurement/vendors`, data).then(
        (r) => r.data,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.vendors.all(orgId) }),
  });
}

/**
 * PATCH .../vendors/:vendorId — the backend binds the full `CreateVendorDto`,
 * so `name` must always be present in the payload.
 */
export function useUpdateVendor(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      patch(`/organizations/${orgId}/procurement/vendors/${id}`, data).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.vendors.detail(orgId, id) });
      void qc.invalidateQueries({ queryKey: QK.vendors.all(orgId) });
    },
  });
}

export function useApproveVendor(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      post(`/organizations/${orgId}/procurement/vendors/${id}/approve`).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.vendors.detail(orgId, id) });
      void qc.invalidateQueries({ queryKey: QK.vendors.all(orgId) });
    },
  });
}

// ─── Requisitions ─────────────────────────────────────────────────────────

export function useRequisitions(orgId: string, params?: object) {
  return useQuery({
    queryKey: QK.requisitions.all(orgId, params),
    queryFn: () =>
      get(`/organizations/${orgId}/procurement/requisitions`, { params }),
    enabled: !!orgId,
  });
}

export function useRequisition(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.requisitions.detail(orgId, id),
    queryFn: () =>
      get(`/organizations/${orgId}/procurement/requisitions/${id}`).then(
        (r) => r.data,
      ),
    enabled: !!orgId && !!id,
  });
}

export function useCreateRequisition(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/procurement/requisitions`, data).then(
        (r) => r.data,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.requisitions.all(orgId) }),
  });
}

export function useTransitionRequisition(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      post(
        `/organizations/${orgId}/procurement/requisitions/${id}/transition`,
        { status },
      ).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: QK.requisitions.detail(orgId, id),
      });
      void qc.invalidateQueries({ queryKey: QK.requisitions.all(orgId) });
    },
  });
}

export function useAddSupplierQuote(orgId: string, reqId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(
        `/organizations/${orgId}/procurement/requisitions/${reqId}/quotes`,
        data,
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.requisitions.detail(orgId, reqId) }),
  });
}

export function useSelectQuote(orgId: string, reqId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quoteId: string) =>
      post(
        `/organizations/${orgId}/procurement/requisitions/${reqId}/quotes/${quoteId}/select`,
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.requisitions.detail(orgId, reqId) }),
  });
}

// ─── Purchase orders ──────────────────────────────────────────────────────

export function usePurchaseOrders(orgId: string, params?: object) {
  return useQuery({
    queryKey: QK.purchaseOrders.all(orgId, params),
    queryFn: () =>
      get(`/organizations/${orgId}/procurement/purchase-orders`, { params }),
    enabled: !!orgId,
  });
}

export function useCreatePurchaseOrder(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/procurement/purchase-orders`, data).then(
        (r) => r.data,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.purchaseOrders.all(orgId) }),
  });
}

// ─── List-friendly procurement mutations ──────────────────────────────────

/** Advances a requisition through the ProcurementStatus workflow, by row id. */
export function useTransitionRequisitionById(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      post(
        `/organizations/${orgId}/procurement/requisitions/${id}/transition`,
        { status },
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.requisitions.all(orgId) }),
  });
}

/** PATCHes a purchase order's status. */
export function useUpdatePurchaseOrderStatus(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      patch(
        `/organizations/${orgId}/procurement/purchase-orders/${id}/status`,
        { status },
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.purchaseOrders.all(orgId) }),
  });
}
