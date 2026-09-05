'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000')
  .replace(/\/api\/v1\/?$/, '')
  .replace(/\/$/, '');
const TRACK_URL = `${API_ORIGIN}/api/v1/public/track`;
const SESSION_KEY = 'gng_wa_sid';

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        (crypto.randomUUID && crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Private mode / storage blocked — fall back to a per-load id.
    return `nostore-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * First-party, cookieless page-view tracker for the public marketing site.
 *
 * - One beacon per page view: the CURRENT page's dwell time is sent when the
 *   visitor navigates away, hides the tab, or unloads — using sendBeacon so it
 *   survives the page teardown.
 * - Session id lives only in sessionStorage (cleared when the tab closes); no
 *   cookie, no cross-site id, no PII. Geo + device are derived server-side from
 *   Vercel edge headers / User-Agent.
 * - Never throws; analytics must not affect the site.
 */
export function WebAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = useRef<{ path: string; enteredAt: number } | null>(null);

  const fullPath =
    pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

  useEffect(() => {
    const send = (path: string, durationMs?: number) => {
      try {
        const body = JSON.stringify({
          sessionId: getSessionId(),
          path,
          referrer: document.referrer || undefined,
          durationMs,
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            TRACK_URL,
            new Blob([body], { type: 'application/json' }),
          );
        } else {
          void fetch(TRACK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
          });
        }
      } catch {
        /* swallow — never break the page */
      }
    };

    // Close out the previous page (record its dwell) before opening the new one.
    const prev = current.current;
    if (prev && prev.path !== fullPath) {
      send(prev.path, Date.now() - prev.enteredAt);
    }

    // Open the new page: log the view immediately (duration filled on exit).
    if (!prev || prev.path !== fullPath) {
      send(fullPath);
      current.current = { path: fullPath, enteredAt: Date.now() };
    }

    // Flush dwell on tab-hide / unload.
    const flush = () => {
      const c = current.current;
      if (c) send(c.path, Date.now() - c.enteredAt);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [fullPath]);

  return null;
}
