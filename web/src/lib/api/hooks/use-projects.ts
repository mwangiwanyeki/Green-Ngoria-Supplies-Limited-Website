'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch } from '../api-client';
import { QK } from '../query-keys';
import type { ProjectSummary } from '../models';

export function useProjects<T = ProjectSummary>(
  orgId: string,
  params?: object,
) {
  return useQuery({
    queryKey: QK.projects.all(orgId, params),
    queryFn: () =>
      get<T[]>(`/organizations/${orgId}/projects`, { params }).then((r) => r),
    enabled: !!orgId,
  });
}

export function useProject(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.projects.detail(orgId, id),
    queryFn: () =>
      get(`/organizations/${orgId}/projects/${id}`).then((r) => r.data),
    enabled: !!orgId && !!id,
  });
}

export function useProjectDashboard(orgId: string) {
  return useQuery({
    queryKey: QK.projects.dashboard(orgId),
    queryFn: () =>
      get(`/organizations/${orgId}/projects/dashboard`).then((r) => r.data),
    enabled: !!orgId,
  });
}

export function useCreateProject(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      post(`/organizations/${orgId}/projects`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.projects.all(orgId) }),
  });
}

/**
 * PATCH /organizations/:orgId/projects/:id — note the backend binds the full
 * `CreateProjectDto`, so callers must send every required field (name).
 */
export function useUpdateProject(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      patch(`/organizations/${orgId}/projects/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.projects.detail(orgId, id) });
      void qc.invalidateQueries({ queryKey: QK.projects.all(orgId) });
      void qc.invalidateQueries({ queryKey: QK.projects.dashboard(orgId) });
    },
  });
}

export function useTransitionProject(orgId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      post(`/organizations/${orgId}/projects/${projectId}/transition`, {
        status,
      }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: QK.projects.detail(orgId, projectId),
      });
      void qc.invalidateQueries({ queryKey: QK.projects.all(orgId) });
    },
  });
}
