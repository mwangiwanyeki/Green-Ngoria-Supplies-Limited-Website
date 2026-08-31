# Green Ngoria — API Reference

## Base URL

```
Development:  http://localhost:3000/api/v1
Production:   https://api.greenngoria.com/api/v1
```

## Authentication

```http
Authorization: Bearer <access_token>
```

Obtain tokens via `POST /api/v1/auth/login`.

## Response envelope

All responses use a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

Error responses:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["email must be an email"],
  "path": "/api/v1/auth/login",
  "timestamp": "2025-08-28T10:00:00.000Z"
}
```

## Pagination

All list endpoints accept:

```
?page=1&limit=20&sortBy=createdAt&sortOrder=desc&search=keyword
```

## API Documentation (Swagger)

Available at `/api/docs` in non-production environments.

---

## Endpoint reference

### Authentication

| Method | Endpoint                    | Description                         |
| ------ | --------------------------- | ----------------------------------- |
| POST   | `/auth/register`            | Register new user                   |
| GET    | `/auth/verify-email?token=` | Verify email address                |
| POST   | `/auth/login`               | Login (returns JWT tokens)          |
| POST   | `/auth/refresh`             | Refresh access token                |
| POST   | `/auth/logout`              | Logout current session              |
| POST   | `/auth/logout-all`          | Revoke all sessions                 |
| POST   | `/auth/forgot-password`     | Request password reset email        |
| POST   | `/auth/reset-password`      | Reset password with token           |
| POST   | `/auth/change-password`     | Change password (authenticated)     |
| POST   | `/auth/mfa/setup`           | Setup MFA (returns secret + QR URL) |
| POST   | `/auth/mfa/enable`          | Enable MFA after verifying code     |
| POST   | `/auth/mfa/disable`         | Disable MFA                         |
| GET    | `/auth/sessions`            | List active sessions                |
| DELETE | `/auth/sessions/:id`        | Revoke specific session             |
| GET    | `/auth/me`                  | Current user profile                |

### Users

| Method | Endpoint                 | Roles Required               |
| ------ | ------------------------ | ---------------------------- |
| POST   | `/users`                 | SUPER_ADMIN, ADMIN           |
| GET    | `/users`                 | SUPER_ADMIN, ADMIN, DIRECTOR |
| GET    | `/users/me`              | Any authenticated            |
| GET    | `/users/:id`             | SUPER_ADMIN, ADMIN, DIRECTOR |
| PATCH  | `/users/me`              | Any authenticated            |
| PATCH  | `/users/:id`             | SUPER_ADMIN, ADMIN           |
| POST   | `/users/:id/deactivate`  | SUPER_ADMIN, ADMIN           |
| POST   | `/users/:id/activate`    | SUPER_ADMIN, ADMIN           |
| POST   | `/users/:id/roles`       | SUPER_ADMIN, ADMIN           |
| DELETE | `/users/:id/roles/:role` | SUPER_ADMIN, ADMIN           |
| GET    | `/users/:id/permissions` | SUPER_ADMIN, ADMIN           |
| GET    | `/users/:id/audit`       | Self or ADMIN                |

### Organizations

| Method | Endpoint                                  | Roles Required                        |
| ------ | ----------------------------------------- | ------------------------------------- |
| POST   | `/organizations`                          | SUPER_ADMIN, ADMIN                    |
| GET    | `/organizations`                          | SUPER_ADMIN, ADMIN, DIRECTOR          |
| GET    | `/organizations/:id`                      | Member of org                         |
| PATCH  | `/organizations/:id`                      | SUPER_ADMIN, ADMIN                    |
| GET    | `/organizations/:id/members`              | Member of org                         |
| POST   | `/organizations/:id/members`              | SUPER_ADMIN, ADMIN, MANAGING_DIRECTOR |
| DELETE | `/organizations/:id/members/:userId`      | SUPER_ADMIN, ADMIN, MANAGING_DIRECTOR |
| PATCH  | `/organizations/:id/members/:userId/role` | SUPER_ADMIN, ADMIN, MANAGING_DIRECTOR |

### Health

| Method | Endpoint        | Auth   |
| ------ | --------------- | ------ |
| GET    | `/health`       | Public |
| GET    | `/health/live`  | Public |
| GET    | `/health/ready` | Public |

---

## Upcoming endpoints (Phase 2+)

```
/clients
/leads
/consultations
/mining-sites
/mineral-projects
/plant-assessments
/plant-assessments/:id/findings
/plant-assessments/:id/recommendations
/equipment
/spares
/rfqs
/quotations
/quotations/:id/approve
/quotations/:id/pdf
/projects
/projects/:id/milestones
/projects/:id/documents
/engineering/documents
/procurement/requisitions
/vendors
/contracts
/invoices
/payments
/site-operations/reports
/hse/incidents
/commissioning/systems
/commissioning/tests
/assets
/maintenance/work-orders
/warranties
/support/tickets
/cms/pages
/notifications
/reports
/analytics
```
