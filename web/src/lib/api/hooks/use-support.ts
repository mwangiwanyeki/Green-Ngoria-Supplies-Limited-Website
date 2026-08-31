'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '../api-client';
import { QK } from '../query-keys';

export function useTickets(orgId: string, params?: object) {
  return useQuery({
    queryKey: QK.tickets.all(orgId, params),
    queryFn: () => get(`/organizations/${orgId}/support/tickets`, { params }),
    enabled: !!orgId,
  });
}

export function useTicket(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.tickets.detail(orgId, id),
    queryFn: () =>
      get(`/organizations/${orgId}/support/tickets/${id}`).then((r) => r.data),
    enabled: !!orgId && !!id,
    refetchInterval: 30_000, // poll for new messages every 30s
  });
}

export function useCreateTicket(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/support/tickets`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.tickets.all(orgId) }),
  });
}

export function useAddTicketMessage(orgId: string, ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      message,
      isInternal,
    }: {
      message: string;
      isInternal?: boolean;
    }) =>
      post(`/organizations/${orgId}/support/tickets/${ticketId}/messages`, {
        message,
        isInternal: isInternal ?? false,
      }).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.tickets.detail(orgId, ticketId) }),
  });
}

export function useAssignTicket(orgId: string, ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignedToId: string) =>
      post(`/organizations/${orgId}/support/tickets/${ticketId}/assign`, {
        assignedToId,
      }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: QK.tickets.detail(orgId, ticketId),
      });
      void qc.invalidateQueries({ queryKey: QK.tickets.all(orgId) });
    },
  });
}

export function useResolveTicket(orgId: string, ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resolution: string) =>
      post(`/organizations/${orgId}/support/tickets/${ticketId}/resolve`, {
        resolution,
      }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: QK.tickets.detail(orgId, ticketId),
      });
      void qc.invalidateQueries({ queryKey: QK.tickets.all(orgId) });
    },
  });
}
