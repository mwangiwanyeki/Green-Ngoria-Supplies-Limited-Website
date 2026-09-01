'use client';

import { useQuery } from '@tanstack/react-query';
import { get, type ApiResponse } from '../api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useBranchStore } from '@/stores/branch-store';

/**
 * Generic org-scoped ERP list query. All ERP endpoints follow the shape
 * `/organizations/:orgId/<path>` and return paginated ApiResponse<T[]>.
 *
 * Every ERP read endpoint requires `branchId` as a query param
 * (`BranchScopeQueryDto`/`BranchScopedPaginationDto` on the backend — see
 * `src/common/dto/branch-scope.dto.ts` — has no `@IsOptional()`). It is read
 * here from the branch store and merged into `params` on every request; a
 * caller-supplied `branchId` in `params` still wins if explicitly passed.
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
      get<T[]>(`/organizations/${orgId}/${path}`, {
        params: { branchId, ...params },
      }),
    enabled: !!accessToken && !!orgId && !!branchId,
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
      get<T>(`/organizations/${orgId}/${path}`, {
        params: { branchId, ...params },
      }).then((r) => r.data),
    enabled: !!accessToken && !!orgId && !!branchId,
  });
}
