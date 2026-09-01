'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '../api-client';
import { QK } from '../query-keys';

/**
 * Daily site reports — `src/module/site-operations/site-operations.controller.ts`.
 *
 * `GET .../site-operations/reports` requires a `projectId` query parameter
 * (it is bound with `ParseUUIDPipe`), so the list is always scoped to one
 * project. The backend exposes no PATCH or DELETE for reports.
 */
export function useSiteReports<T = unknown>(
  orgId: string,
  projectId: string,
  params?: object,
) {
  return useQuery({
    queryKey: QK.siteReports.all(orgId, { projectId, ...(params ?? {}) }),
    queryFn: () =>
      get<T[]>(`/organizations/${orgId}/site-operations/reports`, {
        params: { projectId, ...(params ?? {}) },
      }).then((r) => r),
    enabled: !!orgId && !!projectId,
  });
}

export function useSiteReport(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.siteReports.detail(orgId, id),
    queryFn: () =>
      get(`/organizations/${orgId}/site-operations/reports/${id}`).then(
        (r) => r.data,
      ),
    enabled: !!orgId && !!id,
  });
}

export function useCreateSiteReport(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/site-operations/reports`, data).then(
        (r) => r.data,
      ),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ['orgs', orgId, 'site-operations', 'reports'],
      }),
  });
}
