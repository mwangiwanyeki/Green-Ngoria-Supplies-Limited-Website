import { NextResponse, type NextRequest } from 'next/server';

// ── Session cookie ───────────────────────────────────────────────────────
// The backend issues a signed, HttpOnly refresh-token cookie named
// `gng_refresh` on login (see src/module/auth/auth.controller.ts,
// `setRefreshCookie`). In production it is scoped to `.greenngoria.com` with
// path `/`, so it is visible to every surface here. Its presence is the best
// available edge-side signal that the visitor has an active session; the
// client-side `AuthBoundary` and the API's 401 handling remain the source of
// truth for validity.
//
// NOTE on CSP: it is set statically in next.config.ts, not here. A per-request
// nonce was attempted but Next stamps nonces only on dynamically-rendered
// pages; this marketing site is largely statically prerendered, so the nonce
// never reached the inline hydration scripts and (with strict-dynamic) broke
// them. `script-src 'self' 'unsafe-inline'` in next.config.ts is the correct
// fit for a static Next app.
const SESSION_COOKIE = 'gng_refresh';
const ADMIN_LOGIN_PATH = '/auth/admin';
const PORTAL_LOGIN_PATH = '/auth/login';

/**
 * Which surface a hostname maps to. The one Next.js app is served on three
 * domains: admin.greenngoria.com → /admin/*, portal.greenngoria.com →
 * /portal/*, greenngoria.com/www → public. On the admin/portal subdomains
 * the bare root is rewritten to the matching surface.
 */
function surfaceForHost(host: string): 'admin' | 'portal' | 'public' {
  const h = host.split(':')[0].toLowerCase();
  if (h.startsWith('admin.')) return 'admin';
  if (h.startsWith('portal.')) return 'portal';
  return 'public';
}

const PASS_THROUGH = ['/auth', '/api', '/_next', '/forbidden', '/favicon'];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get('host') ?? '';
  const surface = surfaceForHost(host);
  const hasSession = request.cookies.has(SESSION_COOKIE);

  const redirectToLogin = (s: 'admin' | 'portal') => {
    const loginUrl = new URL(
      s === 'admin' ? ADMIN_LOGIN_PATH : PORTAL_LOGIN_PATH,
      request.url,
    );
    loginUrl.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(loginUrl);
  };

  // ── Hostname → surface rewrite (admin./portal. subdomains) ──────────────
  if (surface !== 'public') {
    const prefix = surface === 'admin' ? '/admin' : '/portal';
    const isPassThrough = PASS_THROUGH.some((p) => pathname.startsWith(p));
    const alreadyPrefixed =
      pathname === prefix || pathname.startsWith(`${prefix}/`);

    if (!isPassThrough && !alreadyPrefixed) {
      if (!hasSession) return redirectToLogin(surface);
      const url = request.nextUrl.clone();
      url.pathname = pathname === '/' ? prefix : `${prefix}${pathname}`;
      return NextResponse.rewrite(url);
    }

    if (alreadyPrefixed && !hasSession) return redirectToLogin(surface);
    return NextResponse.next();
  }

  // ── Public domain: gate only the /admin and /portal paths ───────────────
  if (
    (pathname.startsWith('/admin') || pathname.startsWith('/portal')) &&
    !hasSession
  ) {
    return redirectToLogin(pathname.startsWith('/admin') ? 'admin' : 'portal');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
