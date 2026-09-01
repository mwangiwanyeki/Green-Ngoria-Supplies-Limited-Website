'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from '../api-client';
import { QK } from '../query-keys';

/**
 * "Users" in the admin console are organization members:
 * `GET/POST /organizations/:orgId/members`,
 * `PATCH /organizations/:orgId/members/:userId/role`,
 * `DELETE /organizations/:orgId/members/:userId`
 * (`src/module/organizations/organizations.controller.ts`).
 *
 * Each member row carries the joined `user` record plus its `role` in the org.
 */
export function useOrgMembers<T = unknown>(orgId: string, params?: object) {
  return useQuery({
    queryKey: [...QK.orgs.members(orgId), params ?? {}],
    queryFn: () =>
      get<T[]>(`/organizations/${orgId}/members`, { params }).then((r) => r),
    enabled: !!orgId,
  });
}

/**
 * Directory of platform users, used to pick who to add to an organization.
 * `POST /organizations/:orgId/members` takes an existing `userId` — it does not
 * create accounts, so a person must already exist before being added.
 */
export function useUserDirectory<T = unknown>(params?: object) {
  return useQuery({
    queryKey: QK.users.all(params),
    queryFn: () => get<T[]>('/users', { params }).then((r) => r),
  });
}

export function useAddOrgMember(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; role?: string }) =>
      post(`/organizations/${orgId}/members`, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.orgs.members(orgId) });
      void qc.invalidateQueries({ queryKey: QK.orgs.detail(orgId) });
    },
  });
}

export function useChangeMemberRole(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      patch(`/organizations/${orgId}/members/${userId}/role`, { role }).then(
        (r) => r.data,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.orgs.members(orgId) }),
  });
}

export function useRemoveOrgMember(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      del(`/organizations/${orgId}/members/${userId}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.orgs.members(orgId) });
      void qc.invalidateQueries({ queryKey: QK.orgs.detail(orgId) });
    },
  });
}
