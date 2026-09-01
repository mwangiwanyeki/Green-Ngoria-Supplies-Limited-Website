'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from '../api-client';
import { QK } from '../query-keys';

/**
 * Roles & permissions — backed by `src/module/roles/roles.controller.ts`, which
 * is mounted on `/organizations/:orgId` (note: *not* `/organizations/:orgId/roles`,
 * because the permissions catalogue is a sibling route).
 */

export interface PermissionView {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface RoleView {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissionCount: number;
  permissions: PermissionView[];
  createdAt: string;
}

/** Mirrors CreateRoleDto. `name` is immutable once created. */
export interface CreateRoleInput {
  name: string;
  displayName: string;
  description?: string;
  permissionIds?: string[];
}

/** Mirrors UpdateRoleDto — PartialType(OmitType(CreateRoleDto, ['name'])). */
export type UpdateRoleInput = Partial<Omit<CreateRoleInput, 'name'>>;

export function useRoles(orgId: string) {
  return useQuery({
    queryKey: QK.roles.all(orgId),
    queryFn: () =>
      get<RoleView[]>(`/organizations/${orgId}/roles`).then((r) => r.data),
    enabled: !!orgId,
  });
}

export function useRole(orgId: string, id: string) {
  return useQuery({
    queryKey: QK.roles.detail(orgId, id),
    queryFn: () =>
      get<RoleView>(`/organizations/${orgId}/roles/${id}`).then((r) => r.data),
    enabled: !!orgId && !!id,
  });
}

/** The full permission catalogue, for building the role permission picker. */
export function usePermissions(orgId: string) {
  return useQuery({
    queryKey: QK.permissions.all(orgId),
    queryFn: () =>
      get<PermissionView[]>(`/organizations/${orgId}/permissions`).then(
        (r) => r.data,
      ),
    enabled: !!orgId,
  });
}

export function useCreateRole(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleInput) =>
      post<RoleView>(`/organizations/${orgId}/roles`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.roles.all(orgId) }),
  });
}

export function useUpdateRole(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleInput }) =>
      patch<RoleView>(`/organizations/${orgId}/roles/${id}`, data).then(
        (r) => r.data,
      ),
    onSuccess: (_result, variables) => {
      void qc.invalidateQueries({ queryKey: QK.roles.all(orgId) });
      void qc.invalidateQueries({
        queryKey: QK.roles.detail(orgId, variables.id),
      });
    },
  });
}

export function useDeleteRole(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      del<{ message: string }>(`/organizations/${orgId}/roles/${id}`).then(
        (r) => r.data,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.roles.all(orgId) }),
  });
}

/** Group a flat permission list by its `resource` column for the picker UI. */
export function groupPermissionsByResource(
  permissions: PermissionView[] | undefined,
): { resource: string; permissions: PermissionView[] }[] {
  const groups = new Map<string, PermissionView[]>();
  for (const permission of permissions ?? []) {
    const bucket = groups.get(permission.resource);
    if (bucket) bucket.push(permission);
    else groups.set(permission.resource, [permission]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([resource, list]) => ({ resource, permissions: list }));
}
