'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '../api-client';
import { QK } from '../query-keys';

export interface AnalyticsDashboard {
  leads: { byStatus: Record<string, number> };
  projects: { byStatus: Record<string, number> };
  rfqs: { active: number };
  quotations: { total: number; totalValue: number };
  finance: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
  };
  hse: { openIncidents: number };
  support: { openTickets: number };
}

export function useAnalyticsDashboard(orgId: string) {
  return useQuery({
    queryKey: QK.analytics.dashboard(orgId),
    queryFn: () =>
      get<AnalyticsDashboard>(
        `/organizations/${orgId}/analytics/dashboard`,
      ).then((r) => r.data),
    enabled: !!orgId,
    staleTime: 2 * 60_000,
    refetchInterval: 5 * 60_000, // refresh every 5 min
  });
}
