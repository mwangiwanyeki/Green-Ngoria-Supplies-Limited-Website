import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../lib/database/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { TrackPageViewDto } from './dto/track-page-view.dto';

/** Minimal, dependency-free User-Agent parse — enough for analytics buckets. */
function parseUserAgent(ua: string): {
  deviceType: string;
  browser: string;
  os: string;
} {
  const s = ua.toLowerCase();
  const isBot = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|monitor|headless|lighthouse/.test(s);
  const isTablet = /ipad|tablet|playbook|silk/.test(s) || (/android/.test(s) && !/mobile/.test(s));
  const isMobile = /iphone|ipod|android.*mobile|windows phone|blackberry|bb10|opera mini|mobile/.test(s);
  const deviceType = isBot
    ? 'bot'
    : isTablet
      ? 'tablet'
      : isMobile
        ? 'mobile'
        : 'desktop';

  let browser = 'Other';
  if (/edg\//.test(s)) browser = 'Edge';
  else if (/opr\/|opera/.test(s)) browser = 'Opera';
  else if (/chrome|crios/.test(s) && !/edg\//.test(s)) browser = 'Chrome';
  else if (/firefox|fxios/.test(s)) browser = 'Firefox';
  else if (/safari/.test(s) && !/chrome|crios/.test(s)) browser = 'Safari';
  else if (isBot) browser = 'Bot';

  let os = 'Other';
  if (/windows/.test(s)) os = 'Windows';
  else if (/iphone|ipad|ipod|ios/.test(s)) os = 'iOS';
  else if (/mac os x|macintosh/.test(s)) os = 'macOS';
  else if (/android/.test(s)) os = 'Android';
  else if (/linux/.test(s)) os = 'Linux';

  return { deviceType, browser, os };
}

function header(req: Request, name: string): string | undefined {
  const v = req.headers[name.toLowerCase()];
  const raw = Array.isArray(v) ? v[0] : v;
  if (!raw) return undefined;
  try {
    // Vercel URL-encodes non-ASCII city names.
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

@Injectable()
export class WebAnalyticsService {
  private readonly logger = new Logger(WebAnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgsService: OrganizationsService,
  ) {}

  /**
   * Record one page view. Public + fail-soft: analytics must never break the
   * marketing site, so any error is swallowed and logged.
   */
  async track(dto: TrackPageViewDto, req: Request): Promise<void> {
    try {
      const ua = (req.headers['user-agent'] as string) ?? '';
      const { deviceType, browser, os } = parseUserAgent(ua);

      await this.prisma.webPageView.create({
        data: {
          sessionId: dto.sessionId.slice(0, 64),
          path: dto.path.slice(0, 512),
          referrer: dto.referrer?.slice(0, 512) || null,
          durationMs:
            typeof dto.durationMs === 'number'
              ? Math.min(dto.durationMs, 1000 * 60 * 60) // cap 1h
              : null,
          country: header(req, 'x-vercel-ip-country') ?? null,
          city: header(req, 'x-vercel-ip-city') ?? null,
          region: header(req, 'x-vercel-ip-country-region') ?? null,
          deviceType,
          browser,
          os,
        },
      });
    } catch (err) {
      this.logger.warn(
        `web-analytics track failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Aggregated analytics for the admin dashboard over the last `days` days.
   */
  async getOverview(
    organizationId: string,
    userId: string,
    days = 30,
  ): Promise<unknown> {
    // RBAC: the caller must belong to the organization.
    await this.orgsService.assertMembership(organizationId, userId);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const rows = await this.prisma.webPageView.findMany({
      where: { createdAt: { gte: since } },
      select: {
        sessionId: true,
        path: true,
        referrer: true,
        durationMs: true,
        country: true,
        city: true,
        region: true,
        deviceType: true,
        browser: true,
        os: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const sessions = new Map<
      string,
      {
        sessionId: string;
        views: typeof rows;
        firstAt: Date;
        lastAt: Date;
        country: string | null;
        city: string | null;
        region: string | null;
        deviceType: string | null;
        browser: string | null;
        os: string | null;
        referrer: string | null;
      }
    >();

    for (const r of rows) {
      let s = sessions.get(r.sessionId);
      if (!s) {
        s = {
          sessionId: r.sessionId,
          views: [],
          firstAt: r.createdAt,
          lastAt: r.createdAt,
          country: r.country,
          city: r.city,
          region: r.region,
          deviceType: r.deviceType,
          browser: r.browser,
          os: r.os,
          referrer: r.referrer,
        };
        sessions.set(r.sessionId, s);
      }
      s.views.push(r);
      if (r.createdAt < s.firstAt) s.firstAt = r.createdAt;
      if (r.createdAt > s.lastAt) s.lastAt = r.createdAt;
    }

    const sessionList = Array.from(sessions.values());
    const totalViews = rows.length;
    const totalSessions = sessionList.length;

    const sessionDurations = sessionList.map((s) => {
      const sumPage = s.views.reduce((a, v) => a + (v.durationMs ?? 0), 0);
      const span = s.lastAt.getTime() - s.firstAt.getTime();
      // Prefer summed page durations; fall back to session span.
      return Math.max(sumPage, span);
    });
    const avgSessionDurationMs = totalSessions
      ? Math.round(sessionDurations.reduce((a, b) => a + b, 0) / totalSessions)
      : 0;
    const avgPagesPerSession = totalSessions
      ? Number((totalViews / totalSessions).toFixed(1))
      : 0;

    const todaySessions = new Set(
      rows.filter((r) => r.createdAt >= startOfToday).map((r) => r.sessionId),
    ).size;
    const todayViews = rows.filter((r) => r.createdAt >= startOfToday).length;

    const tally = (
      keyFn: (r: (typeof rows)[number]) => string | null,
    ): Array<{ name: string; value: number }> => {
      const m = new Map<string, number>();
      for (const r of rows) {
        const k = keyFn(r) || 'Unknown';
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return Array.from(m.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    };

    // Top pages with avg time-on-page.
    const pageMap = new Map<string, { views: number; totalMs: number; timed: number }>();
    for (const r of rows) {
      const p = pageMap.get(r.path) ?? { views: 0, totalMs: 0, timed: 0 };
      p.views++;
      if (typeof r.durationMs === 'number') {
        p.totalMs += r.durationMs;
        p.timed++;
      }
      pageMap.set(r.path, p);
    }
    const topPages = Array.from(pageMap.entries())
      .map(([path, v]) => ({
        path,
        views: v.views,
        avgTimeMs: v.timed ? Math.round(v.totalMs / v.timed) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    // Daily timeseries (views + unique sessions).
    const dayMap = new Map<string, { views: number; sessions: Set<string> }>();
    for (const r of rows) {
      const day = r.createdAt.toISOString().slice(0, 10);
      const d = dayMap.get(day) ?? { views: 0, sessions: new Set<string>() };
      d.views++;
      d.sessions.add(r.sessionId);
      dayMap.set(day, d);
    }
    const timeseries = Array.from(dayMap.entries())
      .map(([date, d]) => ({ date, views: d.views, sessions: d.sessions.size }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Recent 40 sessions with their journey (ordered paths).
    const recentSessions = sessionList
      .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime())
      .slice(0, 40)
      .map((s) => ({
        sessionId: s.sessionId,
        startedAt: s.firstAt,
        lastAt: s.lastAt,
        durationMs: Math.max(
          s.views.reduce((a, v) => a + (v.durationMs ?? 0), 0),
          s.lastAt.getTime() - s.firstAt.getTime(),
        ),
        pageCount: s.views.length,
        country: s.country,
        city: s.city,
        region: s.region,
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        referrer: s.referrer,
        journey: s.views.map((v) => v.path),
      }));

    return {
      rangeDays: days,
      totals: {
        pageViews: totalViews,
        sessions: totalSessions,
        avgSessionDurationMs,
        avgPagesPerSession,
        todaySessions,
        todayViews,
      },
      timeseries,
      topPages,
      byCountry: tally((r) => r.country).slice(0, 12),
      byDevice: tally((r) => r.deviceType),
      byBrowser: tally((r) => r.browser).slice(0, 8),
      byReferrer: tally((r) =>
        r.referrer ? new URL(r.referrer, 'http://x').host || 'Direct' : 'Direct',
      ).slice(0, 10),
      recentSessions,
    };
  }
}
