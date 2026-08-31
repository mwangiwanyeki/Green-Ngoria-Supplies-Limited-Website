# Green Ngoria — Security Reference

## Authentication

| Mechanism          | Implementation                                                                |
| ------------------ | ----------------------------------------------------------------------------- |
| Password hashing   | Argon2id — 64MB memory, 3 iterations, 4 parallelism                           |
| Access token       | JWT (HS256), 15-minute expiry                                                 |
| Refresh token      | UUID stored server-side in `UserSession`, 7-day expiry with rotation          |
| MFA                | TOTP (otplib) — mandatory for SUPER_ADMIN, ADMIN, DIRECTOR, MANAGING_DIRECTOR |
| Session management | Server-side records; revoked on password change, logout, forced logout        |
| Account lockout    | 5 failed attempts → 30-minute lockout (configurable)                          |
| Email verification | Required before first login (configurable)                                    |

## Authorization model

```
@Public()          — No authentication required
@UseGuards(JwtAuthGuard)  — JWT required
@Roles('ADMIN')    — Role required (checked after JWT)
@Permissions('quotation:approve')  — Permission required
```

SUPER_ADMIN bypasses permission checks but not JWT authentication.

### Tenant isolation

Every organization-scoped resource query includes `organizationId` in the WHERE clause. `OrganizationsService.assertMembership()` is called at the controller layer before any data access.

Clients **never** access another client's:

- Projects, quotations, invoices, documents, assessments, assets, support tickets

### IDOR prevention

- All IDs are UUIDs — not sequential integers
- Every resource fetch verifies `organizationId` membership
- `ParseUUIDPipe` rejects malformed IDs before they reach the service layer
- No resource ID is trusted without a membership/ownership check

## Transport security

- **Helmet** — strict security headers in production
- **CORS** — explicit allowlist: `greenngoria.com`, `portal.greenngoria.com`, `admin.greenngoria.com`; never wildcard
- **HTTPS** — enforced at infrastructure level (Nginx / load balancer)
- **Cookie flags** — `HttpOnly`, `Secure`, `SameSite=Strict` for session cookies

## Input validation

- Global `ValidationPipe(whitelist: true, forbidNonWhitelisted: true)` — strips and rejects undeclared properties
- All DTOs use `class-validator` decorators
- UUID parameters validated by `ParseUUIDPipe`
- File uploads: MIME type allowlist + extension validation + size limit (50MB default)
- SQL injection: impossible via Prisma parameterized queries

## Sensitive data

- Password hashes never returned in API responses
- `USER_SELECT` constant in `UsersService` explicitly excludes `passwordHash`, `mfaSecret`, `emailVerificationToken`, `passwordResetToken`
- Logs redact: `Authorization`, `cookie`, `password`, `mfaSecret`
- Environment secrets managed via `.env` (never committed)

## Rate limiting

| Endpoint group       | Limit         |
| -------------------- | ------------- |
| Default (all routes) | 100 req / 60s |
| Auth endpoints       | 10 req / 60s  |

## Critical audit events

All events in `AuditAction` enum are logged to the append-only `audit_logs` table:

- Authentication: LOGIN, LOGOUT, LOGIN_FAILED, ACCOUNT_LOCKED
- User management: USER_CREATED, ROLE_ASSIGNED, ROLE_REMOVED
- Financial: PAYMENT_CREATED, INVOICE_ISSUED, CONTRACT_APPROVED
- Engineering: DOCUMENT_APPROVED, COMMISSIONING_APPROVED
- HSE: HSE_INCIDENT_CREATED
- Procurement: PROCUREMENT_APPROVED, PURCHASE_ORDER_CREATED

## Production checklist

- [ ] All secrets in environment variables (not hardcoded)
- [ ] `NODE_ENV=production` disables Swagger and stack traces
- [ ] CORS origins set to production domains only
- [ ] MFA enforced for privileged accounts
- [ ] Database connection via SSL
- [ ] Redis connection via TLS
- [ ] Signed URLs used for all file downloads
- [ ] Dependency vulnerability scanning in CI (pnpm audit)
- [ ] Rate limiting tuned for production traffic
- [ ] Sentry DSN configured for error monitoring
