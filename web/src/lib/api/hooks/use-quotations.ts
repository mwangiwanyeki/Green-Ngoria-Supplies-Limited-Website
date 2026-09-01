'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '../api-client';
import { QK } from '../query-keys';
import type { QuotationSummary } from '../models';

export function useQuotations<T = QuotationSummary>(
  orgId: string,
  params?: object,
) {
  return useQuery({
    queryKey: QK.quotations.all(orgId, params),
    queryFn: () =>
      get<T[]>(`/organizations/${orgId}/quotations`, { params }).then((r) => r),
    enabled: !!orgId,
  });
}

export function useQuotation(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.quotations.detail(orgId, id),
    queryFn: () =>
      get(`/organizations/${orgId}/quotations/${id}`).then((r) => r.data),
    enabled: !!orgId && !!id,
  });
}

export function useCreateQuotation(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/quotations`, data).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.quotations.all(orgId) }),
  });
}

export function useApproveQuotation(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      post(`/organizations/${orgId}/quotations/${id}/approve`).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: QK.quotations.detail(orgId, id),
      });
      void qc.invalidateQueries({ queryKey: QK.quotations.all(orgId) });
    },
  });
}

/**
 * Quotations have no PATCH endpoint — the backend models an edit as a new
 * revision (`POST :id/revise`, which snapshots the current version and resets
 * it to DRAFT). Pass the reason for the revision.
 */
export function useReviseQuotation(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) =>
      post(`/organizations/${orgId}/quotations/${id}/revise`, { reason }).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.quotations.detail(orgId, id) });
      void qc.invalidateQueries({ queryKey: QK.quotations.all(orgId) });
    },
  });
}

export function useSubmitQuotation(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      post(`/organizations/${orgId}/quotations/${id}/submit`).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.quotations.detail(orgId, id) });
      void qc.invalidateQueries({ queryKey: QK.quotations.all(orgId) });
    },
  });
}

/** There is no DELETE for quotations — rejecting is the terminal action. */
export function useRejectQuotation(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) =>
      post(`/organizations/${orgId}/quotations/${id}/reject`, { reason }).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.quotations.detail(orgId, id) });
      void qc.invalidateQueries({ queryKey: QK.quotations.all(orgId) });
    },
  });
}

export function useSendQuotation(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      post(`/organizations/${orgId}/quotations/${id}/send`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.quotations.detail(orgId, id) });
      void qc.invalidateQueries({ queryKey: QK.quotations.all(orgId) });
    },
  });
}
