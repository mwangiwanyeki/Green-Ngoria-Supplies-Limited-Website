'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useErpList } from './use-erp';
import { get, post, patch } from '../api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useBranchStore } from '@/stores/branch-store';

export interface Visitor {
  id: string;
  fullName: string;
  badgeNumber?: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  company?: string;
  purpose?: string;
  host?: string;
  hostName?: string;
  vehiclePlate?: string;
  checkInAt: string;
  checkOutAt?: string | null;
  status?: 'checked-in' | 'checked-out' | 'CHECKED_IN' | 'CHECKED_OUT';
}

export interface VisitorStats {
  checkedInNow: number;
  todaysVisitors: number;
}

export interface CreateVisitorPayload {
  branchId: string;
  fullName: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  company?: string;
  purpose?: string;
  hostName?: string;
  vehiclePlate?: string;
}

export function useVisitors(params?: Record<string, unknown>) {
  return useErpList<Visitor>('visitors', params);
}

export function useVisitorStats() {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const branchId = useBranchStore((s) => s.activeBranchId);
  return useQuery<VisitorStats>({
    queryKey: ['erp', orgId, branchId, 'visitors/stats'],
    queryFn: () =>
      get<VisitorStats>(`/organizations/${orgId}/visitors/stats`, {
        params: { branchId },
      }).then((r) => r.data),
    enabled: !!accessToken && !!orgId && !!branchId,
    staleTime: 30_000,
  });
}

export function useCreateVisitor() {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVisitorPayload) =>
      post(`/organizations/${orgId}/visitors`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['erp', orgId] }),
  });
}

export function useCheckOutVisitor() {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      patch(`/organizations/${orgId}/visitors/${id}/check-out`, {}).then(
        (r) => r.data,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['erp', orgId] }),
  });
}
