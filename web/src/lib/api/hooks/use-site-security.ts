'use client';

import { useErpList, useErpResource } from './use-erp';

export interface SecurityLog {
  id: string;
  incidentType: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  reportedBy?: string;
  status?: 'open' | 'resolved' | 'investigating';
  description?: string;
  occurredAt: string;
}

export interface SecurityStats {
  openCount: number;
  resolvedCount: number;
  criticalCount: number;
}

export function useSecurityLogs(params?: Record<string, unknown>) {
  return useErpList<SecurityLog>('security-logs', params);
}

export function useSecurityStats() {
  return useErpResource<SecurityStats>('security-logs/stats');
}
