import { NextResponse, type NextRequest } from 'next/server';

// ── Session cookie ───────────────────────────────────────────────────────
// The backend issues a signed, HttpOnly refresh-token cookie named
// `gng_refresh` on login (see src/module/auth/auth.controller.ts,
// `setRefreshCookie`). The short-lived access token itself is kept in
// memory on the client (never persisted, see api-client.ts) and so is not
// observable here — presence of the refresh cookie is the best available
// edge-side signal that the visitor has an active session. It does not
// prove the token is still valid; the client-side `AuthBoundary` check and
// the API's own 401 handling remain the source of truth for that.
const SESSION_COOKIE = 'gng_refresh';
// Admin/staff and client-portal areas have separate sign-in pages, so an
// unauthenticated visitor is sent to the login page that matches the area
// they were trying to reach.
const ADMIN_LOGIN_PATH = '/auth/admin';
const PORTAL_LOGIN_PATH = '/auth/login';

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession) {
    const loginPath = request.nextUrl.pathname.startsWith('/admin')
      ? ADMIN_LOGIN_PATH
      : PORTAL_LOGIN_PATH;
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set(
      'redirect',
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*'],
};
