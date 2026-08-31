# Memory — Platform Reliability and Security Completion

Last updated: 2026-08-30 (Africa/Nairobi)

## What was built

- Hardened NestJS authentication, authorization, tenant isolation, secure file delivery, finance validation, API typing, and database access patterns.
- Added a Prisma baseline migration and query-aligned indexes for the enterprise platform schema.
- Completed missing public, admin, portal, error, and forbidden routes; added role-aware client-side access boundaries.
- Added response models for frontend data hooks, fixed form, dashboard, and query invalidation issues, and aligned visual tokens.
- Ran a UI consistency audit. The codebase consistently uses semantic background/border/text tokens and brand palette tokens; radius variants are intentional by component tier. Baseline registry confirmation is pending before creating `ui-registry.md`.

## Decisions made

- Refresh tokens are opaque, hashed in `UserSession`, rotated on use, and sent only in an HttpOnly, Secure-in-production, SameSite=Strict cookie. Access tokens remain in memory only.
- NestJS global authentication, RBAC, permission, and organization-tenant guards make endpoints private by default. Public endpoints use explicit `@Public()`.
- The frontend uses local system font stacks instead of `next/font/google`, so builds do not depend on Google network access.
- The web workspace is aligned with Next.js 16, matching the existing root toolchain and removing the vulnerable nested Next.js 15/PostCSS dependency path.

## Problems solved

- Corrected a broken refresh-token flow that stored a session identifier but returned a JWT token incompatible with refresh lookup.
- Removed database/query `any` casts from analytics and workflow notifications by using Prisma enums.
- Fixed production prerender failures caused by unwrapped `useSearchParams()` calls in authentication pages.
- Fixed frontend production build failures caused by downloading Google Fonts at build time.

## Current state

- Backend lint, TypeScript build check, Prisma validation, unit tests, and E2E tests pass.
- Frontend lint, TypeScript check, and Next.js 16 production build pass for all generated routes.
- Production dependency audit passed before a later registry retry encountered a transient registry access error; no code or lockfile change occurred after the successful audit other than formatting and enum typing.
- The live Supabase `public` schema was reset on 2026-08-30 at the user's explicit request. All three committed Prisma migrations were then applied successfully and Prisma reports the database up to date. Supabase-managed schemas (including `auth` and `storage`) were preserved.

## Next session starts with

- Seed approved non-production data only if needed, then run tenant-isolation, authorization, and file-storage integration tests against the connected Supabase database.

## Open questions

- Confirm the production Supabase project reference, database connection, and whether the public Data API is enabled. If it is, configure and verify appropriate RLS policies before exposing any tables.
- Confirm the UI baseline so `ui-registry.md` can be created: controls use `rounded-md`; data cards use `rounded-lg`; marketing panels use `rounded-xl`/`rounded-2xl`; semantic color tokens and `brand-*` are required.
