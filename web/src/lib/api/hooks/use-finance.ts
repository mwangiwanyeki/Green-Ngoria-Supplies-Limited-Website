'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '../api-client';
import { QK } from '../query-keys';

export function useFinanceSummary(orgId: string) {
  return useQuery({
    queryKey: ['orgs', orgId, 'finance', 'summary'],
    queryFn: () =>
      get(`/organizations/${orgId}/finance/summary`).then((r) => r.data),
    enabled: !!orgId,
  });
}

export function useInvoices(orgId: string, params?: object) {
  return useQuery({
    queryKey: QK.invoices.all(orgId, params),
    queryFn: () => get(`/organizations/${orgId}/finance/invoices`, { params }),
    enabled: !!orgId,
  });
}

export function useInvoice(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.invoices.detail(orgId, id),
    queryFn: () =>
      get(`/organizations/${orgId}/finance/invoices/${id}`).then((r) => r.data),
    enabled: !!orgId && !!id,
  });
}

export function useCreateInvoice(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/finance/invoices`, data).then(
        (r) => r.data,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.invoices.all(orgId) }),
  });
}

export function useIssueInvoice(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      post(`/organizations/${orgId}/finance/invoices/${id}/issue`).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.invoices.detail(orgId, id) });
      void qc.invalidateQueries({ queryKey: QK.invoices.all(orgId) });
    },
  });
}

export function useRecordPayment(orgId: string, invoiceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(
        `/organizations/${orgId}/finance/invoices/${invoiceId}/payments`,
        data,
      ).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: QK.invoices.detail(orgId, invoiceId),
      });
      void qc.invalidateQueries({
        queryKey: ['orgs', orgId, 'finance', 'summary'],
      });
    },
  });
}
