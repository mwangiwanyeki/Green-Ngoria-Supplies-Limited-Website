import { NextResponse, type NextRequest } from 'next/server';

// ── Session cookie ───────────────────────────────────────────────────────
// The backend issues a signed, HttpOnly refresh-token cookie named
// `gng_refresh` on login (see src/module/auth/auth.controller.ts,
// `setRefreshCookie`). In production it is scoped to `.greenngoria.com` with
// path `/`, so it is visible to every surface here. Its presence is the best
// available edge-side signal that the visitor has an active session; the
// client-side `AuthBoundary` and the API's 401 handling remain the source of
// truth for validity.
const SESSION_COOKIE = 'gng_refresh';
const ADMIN_LOGIN_PATH = '/auth/admin';
const PORTAL_LOGIN_PATH = '/auth/login';

/**
 * Which surface a hostname maps to. The one Next.js app is served on three
 * domains:
 *   admin.greenngoria.com   → staff/admin platform (/admin/*)
 *   portal.greenngoria.com  → client portal (/portal/*)
 *   greenngoria.com / www   → public marketing site (everything else)
 * On the admin/portal subdomains the bare root is rewritten to the matching
 * surface so `admin.greenngoria.com` lands on the dashboard. Paths that are
 * already surface-prefixed, auth pages, API, and Next internals pass through.
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

  // ── Hostname → surface rewrite (admin./portal. subdomains) ──────────────
  if (surface !== 'public') {
    const prefix = surface === 'admin' ? '/admin' : '/portal';
    const isPassThrough = PASS_THROUGH.some((p) => pathname.startsWith(p));
    const alreadyPrefixed =
      pathname === prefix || pathname.startsWith(`${prefix}/`);

    if (!isPassThrough && !alreadyPrefixed) {
      // Gate protected surfaces at the edge before rewriting in.
      if (!hasSession) {
        return redirectToLogin(request, surface);
      }
      const url = request.nextUrl.clone();
      url.pathname = pathname === '/' ? prefix : `${prefix}${pathname}`;
      return NextResponse.rewrite(url);
    }

    if (alreadyPrefixed && !hasSession) {
      return redirectToLogin(request, surface);
    }
    return NextResponse.next();
  }

  // ── Public domain: gate only the /admin and /portal paths ───────────────
  if (
    (pathname.startsWith('/admin') || pathname.startsWith('/portal')) &&
    !hasSession
  ) {
    return redirectToLogin(
      request,
      pathname.startsWith('/admin') ? 'admin' : 'portal',
    );
  }

  return NextResponse.next();

  function redirectToLogin(req: NextRequest, s: 'admin' | 'portal') {
    const loginUrl = new URL(
      s === 'admin' ? ADMIN_LOGIN_PATH : PORTAL_LOGIN_PATH,
      req.url,
    );
    loginUrl.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  // Run on everything except Next internals and static files, so hostname
  // rewriting works for the admin/portal subdomains. The function itself
  // fast-returns for pass-through paths on the public domain.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
