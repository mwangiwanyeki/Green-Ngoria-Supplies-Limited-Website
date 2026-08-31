'use client';

import { useErpList } from './use-erp';

export interface ActivityLogEntry {
  id: string;
  actorName?: string;
  actorEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ip?: string;
  createdAt: string;
}

export function useActivityLogs(params?: Record<string, unknown>) {
  return useErpList<ActivityLogEntry>('audit-logs', params);
}
