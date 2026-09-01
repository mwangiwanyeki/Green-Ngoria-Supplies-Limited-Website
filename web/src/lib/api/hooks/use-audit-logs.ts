'use client';

import { useQuery } from '@tanstack/react-query';
import { get, type ApiResponse } from '../api-client';
import { QK } from '../query-keys';

/**
 * Audit logs — backed by `src/module/audit/audit-logs.controller.ts`
 * (`/organizations/:orgId/audit-logs`). Read-only by design: entries are
 * append-only and written by `AuditService.log()` from the feature modules.
 *
 * `use-activity-logs.ts` already hits the same route with a thinner projection
 * for the ERP activity widget; this hook exposes the full row plus the filter
 * facets the admin screen needs.
 */

export interface AuditLogView {
  id: string;
  action: string;
  entity: string;
  /** Alias of `entity` served by the backend view. */
  entityType: string;
  entityId: string | null;
  actorId: string;
  actorName: string;
  actorEmail: string;
  organizationName: string | null;
  ipAddress: string | null;
  ip: string | null;
  userAgent: string | null;
  details: unknown;
  createdAt: string;
}

/** Mirrors QueryAuditLogsDto (extends PaginationDto). */
export interface AuditLogParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  action?: string;
  entity?: string;
  entityId?: string;
  userId?: string;
  /** ISO 8601 inclusive lower bound. */
  from?: string;
  /** ISO 8601 inclusive upper bound. */
  to?: string;
}

export interface AuditLogFacets {
  actions: string[];
  entities: string[];
}

/** Returns the full envelope so callers can read `meta` for pagination. */
export function useAuditLogs(orgId: string, params?: AuditLogParams) {
  return useQuery<ApiResponse<AuditLogView[]>>({
    queryKey: QK.auditLogs.all(orgId, params),
    queryFn: () =>
      get<AuditLogView[]>(`/organizations/${orgId}/audit-logs`, { params }),
    enabled: !!orgId,
  });
}

export function useAuditLogFacets(orgId: string) {
  return useQuery({
    queryKey: QK.auditLogs.facets(orgId),
    queryFn: () =>
      get<AuditLogFacets>(`/organizations/${orgId}/audit-logs/facets`).then(
        (r) => r.data,
      ),
    enabled: !!orgId,
  });
}
