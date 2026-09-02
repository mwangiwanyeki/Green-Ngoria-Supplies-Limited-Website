import type { NextConfig } from 'next';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000')
  .replace(/\/api\/v1\/?$/, '')
  .replace(/\/$/, '');
const isProduction = process.env.NODE_ENV === 'production';
const apiOrigin = new URL(API_URL).origin;
// `script-src` allows 'unsafe-inline': Next.js emits inline bootstrap/
// streaming scripts for hydration on every (including statically prerendered)
// page. A strict `script-src 'self'` blocked them → hydration failed (React
// #412) and the app was inert. A per-request nonce doesn't help here because
// nonces are only applied to dynamically-rendered pages, and this site is
// largely static. 'unsafe-inline' is the standard, working CSP for a static
// Next deployment; XSS is mitigated by React's default escaping, the strict
// object-src/base-uri/form-action directives below, and input validation.
const contentSecurityPolicy = [
  "default-src 'self'",
  isProduction
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://plus.unsplash.com",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin}${isProduction ? '' : ' ws: wss:'}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProduction ? ['upgrade-insecure-requests'] : []),
].join('; ');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'luplbbigarnyyxbudviu.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // ── Proxy all /api/* calls through Next.js → NestJS backend ─────────────
  // This avoids CORS issues and keeps credentials working cleanly.
  // api-client.ts uses NEXT_PUBLIC_API_URL directly for server-to-server calls
  // but browser calls can go through this proxy in production.
  rewrites: () =>
    Promise.resolve([
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ]),

  // ── Headers ───────────────────────────────────────────────────────────────
  headers: () =>
    Promise.resolve([
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          ...(isProduction
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
        ],
      },
    ]),

  typedRoutes: false,
};

export default nextConfig;
