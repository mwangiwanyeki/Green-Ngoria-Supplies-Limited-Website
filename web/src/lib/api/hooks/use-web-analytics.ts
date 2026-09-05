'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '../api-client';
import { useAuthStore } from '@/stores/auth-store';

export interface WebAnalyticsOverview {
  rangeDays: number;
  totals: {
    pageViews: number;
    sessions: number;
    avgSessionDurationMs: number;
    avgPagesPerSession: number;
    todaySessions: number;
    todayViews: number;
  };
  timeseries: Array<{ date: string; views: number; sessions: number }>;
  topPages: Array<{ path: string; views: number; avgTimeMs: number }>;
  byCountry: Array<{ name: string; value: number }>;
  byDevice: Array<{ name: string; value: number }>;
  byBrowser: Array<{ name: string; value: number }>;
  byReferrer: Array<{ name: string; value: number }>;
  recentSessions: Array<{
    sessionId: string;
    startedAt: string;
    lastAt: string;
    durationMs: number;
    pageCount: number;
    country: string | null;
    city: string | null;
    region: string | null;
    deviceType: string | null;
    browser: string | null;
    os: string | null;
    referrer: string | null;
    journey: string[];
  }>;
}

export function useWebAnalytics(days = 30) {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<WebAnalyticsOverview>({
    queryKey: ['web-analytics', orgId, days],
    queryFn: () =>
      get<WebAnalyticsOverview>(
        `/organizations/${orgId}/web-analytics/overview`,
        { params: { days } },
      ).then((r) => r.data),
    enabled: !!accessToken && !!orgId,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
