'use client';

import { useQuery } from '@tanstack/react-query';
import { get, type ApiResponse } from '../api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useBranchStore } from '@/stores/branch-store';

/**
 * Generic org-scoped ERP list query. All ERP endpoints follow the shape
 * `/organizations/:orgId/<path>` and return paginated ApiResponse<T[]>.
 */
export function useErpList<T = unknown>(
  path: string,
  params?: Record<string, unknown>,
) {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const branchId = useBranchStore((s) => s.activeBranchId);
  return useQuery<ApiResponse<T[]>>({
    queryKey: ['erp', orgId, branchId, path, params ?? {}],
    queryFn: () =>
      get<T[]>(`/organizations/${orgId}/${path}`, { params }),
    enabled: !!accessToken && !!orgId,
  });
}

export function useErpResource<T = unknown>(
  path: string,
  params?: Record<string, unknown>,
) {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const branchId = useBranchStore((s) => s.activeBranchId);
  return useQuery<T>({
    queryKey: ['erp', orgId, branchId, path, 'one', params ?? {}],
    queryFn: () =>
      get<T>(`/organizations/${orgId}/${path}`, { params }).then((r) => r.data),
    enabled: !!accessToken && !!orgId,
  });
}
