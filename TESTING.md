# Green Ngoria — Testing Guide

## Test stack

- **Unit tests:** Jest + `@nestjs/testing`
- **Integration tests:** Jest + Supertest + test database
- **E2E tests:** Jest + Supertest (full HTTP)
- **Security tests:** Custom test suites for auth, IDOR, tenant isolation

## Running tests

```bash
# Unit tests
pnpm test

# Unit tests with coverage
pnpm test:cov

# E2E tests
pnpm test:e2e

# Single run (no watch mode)
pnpm test -- --runInBand
```

## Test categories

### Unit tests (service layer)

Each service has a corresponding `.spec.ts`:

```
auth.service.spec.ts       — password hashing, token generation, MFA
users.service.spec.ts      — CRUD, role assignment
organizations.service.spec.ts — membership, tenant isolation
audit.service.spec.ts      — append-only logging
```

### Integration tests (database)

Run against a test database (`DATABASE_URL` pointing to test DB).

Areas covered:

- Authentication flow (register → verify → login → refresh → logout)
- RBAC assignment and permission checking
- Organization membership and isolation

### E2E tests

Full HTTP request/response tests via Supertest:

```
POST /api/v1/auth/register     → 201
POST /api/v1/auth/login        → 200 with tokens
GET  /api/v1/auth/me           → 200 with user profile
POST /api/v1/organizations     → 201 (admin)
GET  /api/v1/health            → 200
```

### Security tests (mandatory before production)

| Test                  | What it verifies                   |
| --------------------- | ---------------------------------- |
| Cross-tenant IDOR     | User A cannot access User B's data |
| Invalid JWT           | Rejected with 401                  |
| Expired token         | Rejected with 401                  |
| Revoked session       | Rejected with 401                  |
| Missing role          | Rejected with 403                  |
| Missing permission    | Rejected with 403                  |
| Invalid upload MIME   | Rejected with 400                  |
| Mass assignment       | Extra fields stripped              |
| Rate limiting         | 429 after threshold                |
| SQL injection attempt | Safely handled by Prisma           |
| XSS in string fields  | Stored as plain text, not executed |

## Test database setup

```bash
# Create test DB
createdb greenngoria_test

# Set in .env.test
DATABASE_URL=postgresql://user:pass@localhost:5432/greenngoria_test

# Run test migrations
NODE_ENV=test pnpm prisma migrate deploy
```

## Coverage targets

| Layer               | Target |
| ------------------- | ------ |
| Services            | ≥ 80%  |
| Guards              | 100%   |
| State machines      | 100%   |
| Financial workflows | 100%   |
| Auth workflows      | 100%   |
