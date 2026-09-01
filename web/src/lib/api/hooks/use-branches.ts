'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '../api-client';
import { useAuthStore } from '@/stores/auth-store';

export interface Branch {
  id: string;
  name: string;
  code?: string | null;
  isDefault?: boolean;
  city?: string | null;
  county?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export function useBranches() {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['branches', orgId],
    queryFn: () =>
      get<Branch[]>(`/organizations/${orgId}/branches`).then((r) => r.data),
    enabled: !!accessToken && !!orgId,
  });
}

export function useBranchBusinessProfile(branchId: string | null | undefined) {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['branches', orgId, branchId, 'settings', 'business-profile'],
    queryFn: () =>
      get(
        `/organizations/${orgId}/branches/${branchId}/settings/business-profile`,
      ).then((r) => r.data),
    enabled: !!accessToken && !!orgId && !!branchId,
  });
}

export function useUpdateBranchBusinessProfile(branchId: string) {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      patch(
        `/organizations/${orgId}/branches/${branchId}/settings/business-profile`,
        data,
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ['branches', orgId, branchId, 'settings'],
      }),
  });
}

export function useBranchGeneralSettings(branchId: string | null | undefined) {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['branches', orgId, branchId, 'settings', 'general'],
    queryFn: () =>
      get(`/organizations/${orgId}/branches/${branchId}/settings/general`).then(
        (r) => r.data,
      ),
    enabled: !!accessToken && !!orgId && !!branchId,
  });
}

export function useUpdateBranchGeneralSettings(branchId: string) {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      patch(
        `/organizations/${orgId}/branches/${branchId}/settings/general`,
        data,
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ['branches', orgId, branchId, 'settings'],
      }),
  });
}

export interface BranchSessionSecurity {
  autoLogoutEnabled: boolean;
  idleTimeoutMinutes: number;
  warningCountdownSeconds: number;
}

export function useBranchSessionSecurity(branchId: string | null | undefined) {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['branches', orgId, branchId, 'settings', 'session-security'],
    queryFn: () =>
      get<BranchSessionSecurity>(
        `/organizations/${orgId}/branches/${branchId}/settings/session-security`,
      ).then((r) => r.data),
    enabled: !!accessToken && !!orgId && !!branchId,
  });
}

export function useUpdateBranchSessionSecurity(branchId: string) {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BranchSessionSecurity>) =>
      patch(
        `/organizations/${orgId}/branches/${branchId}/settings/session-security`,
        data,
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ['branches', orgId, branchId, 'settings'],
      }),
  });
}
