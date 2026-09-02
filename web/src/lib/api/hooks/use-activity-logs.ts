'use client';

import { useQuery } from '@tanstack/react-query';
import { get, type ApiResponse } from '../api-client';
import { useAuthStore } from '@/stores/auth-store';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActivityLogEntry {
  id: string;
  action: string;
  entity: string;
  /** Alias of entity — both are always present in the API response. */
  entityType: string;
  entityId: string | null;
  actorId: string;
  actorName: string;
  actorEmail: string;
  organizationName: string | null;
  ipAddress: string | null;
  /** Alias of ipAddress. */
  ip: string | null;
  userAgent: string | null;
  /** Serialised JSON from newValues / metadata — rich change context. */
  details: unknown;
  createdAt: string;
}

export interface AuditFacets {
  actions: string[];
  entities: string[];
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Uses plain useQuery — NOT useErpList — because:
 * 1. The endpoint is /organizations/:orgId/audit-logs (no branchId required).
 * 2. useErpList blocks when branchId is null and injects branchId into params,
 *    which would cause the query to silently never fire.
 */
export function useActivityLogs(params?: {
  search?: string;
  action?: string;
  entity?: string;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const accessToken = useAuthStore((s) => s.accessToken);

  // Strip empty string values so they don't reach the backend as ?action=
  const cleaned: Record<string, unknown> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== '' && v !== undefined && v !== null) cleaned[k] = v;
    }
  }

  return useQuery<ApiResponse<ActivityLogEntry[]>>({
    queryKey: ['orgs', orgId, 'audit-logs', cleaned],
    queryFn: () =>
      get<ActivityLogEntry[]>(`/organizations/${orgId}/audit-logs`, {
        params: cleaned,
      }),
    enabled: !!accessToken && !!orgId,
    staleTime: 30_000,
  });
}

export function useAuditFacets() {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<AuditFacets>({
    queryKey: ['orgs', orgId, 'audit-logs', 'facets'],
    queryFn: () =>
      get<AuditFacets>(`/organizations/${orgId}/audit-logs/facets`).then(
        (r) => r.data,
      ),
    enabled: !!accessToken && !!orgId,
    staleTime: 5 * 60_000,
  });
}
