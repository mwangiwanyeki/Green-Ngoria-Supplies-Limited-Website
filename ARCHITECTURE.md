# Green Ngoria Supplies Limited — Backend Architecture

## Platform identity

Green Ngoria Supplies Limited is a mining, mineral processing, engineering and construction company with particular expertise in gold-processing plants including Carbon-in-Pulp (CIP) and Carbon-in-Leach (CIL) systems. Operations span Kenya, Tanzania and East Africa.

This backend is not a generic web application. It is a **unified enterprise mining-plant operations platform** connecting the complete business lifecycle from lead to long-term maintenance.

---

## Architecture pattern

**Modular monolith** — a single deployable NestJS application with clearly bounded domain modules. Microservices are explicitly deferred until justified by scale evidence.

### Principles

- NestJS-first: dependency injection throughout, no `new Service()` or `new PrismaClient()`
- Database-first integrity: foreign keys, constraints, indexes, transactions
- Secure-by-default: auth required on every route unless `@Public()` explicitly set
- API-first: every business operation exposed via a versioned REST endpoint
- Observable: structured logging, request IDs, health checks, audit trails

---

## Directory structure

```
src/
├── config/                     # Environment configuration and validation
│   ├── configuration.ts        # Typed config factory
│   └── validation.schema.ts    # Joi validation schema for env vars
│
├── lib/                        # Infrastructure — all @Global() modules
│   ├── database/               # PrismaModule + PrismaService
│   ├── mail/                   # MailModule + MailService (Nodemailer)
│   ├── storage/                # StorageModule + StorageService (S3/local)
│   ├── queue/                  # QueueModule (BullMQ) + queue constants
│   ├── audit/                  # AuditModule + AuditService
│   ├── cache/                  # CacheModule + CacheService
│   ├── notifications/          # NotificationsModule + NotificationsService
│   └── health/                 # HealthModule + health indicators
│
├── common/                     # Shared cross-cutting utilities
│   ├── decorators/             # @CurrentUser, @Public, @Roles, @Permissions
│   ├── dto/                    # PaginationDto
│   ├── filters/                # GlobalExceptionFilter
│   ├── guards/                 # RolesGuard, PermissionsGuard
│   ├── interceptors/           # RequestIdInterceptor, TransformInterceptor
│   ├── pipes/                  # ParseUUIDPipe
│   ├── response/               # ApiResponse helpers
│   └── utils/                  # Pagination, reference number generators
│
├── module/                     # Feature domain modules
│   ├── auth/                   # JWT auth, sessions, MFA, password management
│   ├── users/                  # User management, RBAC
│   ├── organizations/          # Multi-tenancy, membership
│   ├── clients/                # Client management
│   ├── leads/                  # CRM leads
│   ├── crm/                    # CRM pipeline and activities
│   ├── consultations/          # Technical consultations
│   ├── mining-sites/           # Mine site registry
│   ├── mineral-projects/       # Mineral project records
│   ├── plant-assessments/      # Technical Plant Assessment (System 4)
│   ├── equipment/              # Equipment catalogue
│   ├── spares/                 # Spare parts catalogue
│   ├── rfqs/                   # Request for Quotation
│   ├── quotations/             # Quotation engine + PDF generation
│   ├── projects/               # Project management (System 1)
│   ├── engineering/            # Engineering document control (System 5)
│   ├── procurement/            # Procurement workflow (System 6)
│   ├── vendors/                # Vendor management
│   ├── contracts/              # Contract management (System 7)
│   ├── finance/                # Finance overview
│   ├── invoices/               # Invoice management
│   ├── payments/               # Payment tracking
│   ├── site-operations/        # Daily site reports (System 8)
│   ├── hse/                    # HSE incidents and inspections
│   ├── commissioning/          # Commissioning tests and approval
│   ├── handover/               # Project handover
│   ├── assets/                 # Plant asset register (System 9)
│   ├── maintenance/            # Maintenance work orders
│   ├── warranties/             # Warranty tracking and claims
│   ├── support/                # Customer support tickets
│   ├── cms/                    # Content management
│   ├── notifications/          # Notification endpoints
│   ├── reports/                # Report generation
│   └── analytics/              # Dashboard metrics
│
├── app.module.ts               # Root module — wires all infrastructure and features
└── main.ts                     # Bootstrap: security, CORS, Swagger, validation
```

---

## The connected lifecycle

Every major entity shares the same `organizationId`, `userId`, `projectId`, `clientId` references so the platform can trace a business opportunity from inception to long-term support:

```
Website visitor
  → Lead (CRM)
  → Consultation
  → Technical Plant Assessment
  → Opportunity / RFQ
  → Quotation (with PDF)
  → Contract
  → Project
  → Engineering Documents
  → Procurement
  → Construction (Site Reports, HSE)
  → Commissioning Tests
  → Handover
  → Asset Register
  → Maintenance Work Orders
  → Warranty Tracking
  → Customer Support
```

All steps share: `Organization · User · Client · Project · Documents · Activities · Notifications · Audit Trail`

---

## Nine business systems

| #   | System                                 | Core entities                                        |
| --- | -------------------------------------- | ---------------------------------------------------- |
| 1   | Client & Project Management            | Client, Project, Milestone, Task, Risk               |
| 2   | Equipment, Spares, RFQ, Quotation      | Equipment, SparePart, Rfq, Quotation                 |
| 3   | CRM + CMS                              | Lead, CrmActivity, Consultation, CmsPage             |
| 4   | Technical Plant Assessment             | PlantAssessment, Finding, Recommendation             |
| 5   | Engineering Document Control           | EngineeringDocument, DocumentRevision                |
| 6   | Procurement & Vendors                  | ProcurementRequisition, Vendor, PurchaseOrder        |
| 7   | Contracts, Finance, Invoicing          | Contract, Invoice, Payment                           |
| 8   | Site Operations, HSE, Commissioning    | SiteReport, HseIncident, CommissioningTest           |
| 9   | Assets, Maintenance, Warranty, Support | Asset, MaintenanceWorkOrder, Warranty, SupportTicket |

---

## Security model

- JWT (15 min access) + refresh token rotation (7 day, server-side session record)
- Argon2id password hashing (memory-cost 64MB, 3 iterations, 4 parallelism)
- MFA (TOTP) — mandatory for privileged roles in production
- RBAC: 21 roles mapped to fine-grained permissions
- Tenant isolation: every org-scoped query includes `organizationId`; `OrganizationsService.assertMembership()` enforces access server-side
- `@Public()` decorator required to expose any route without authentication
- Rate limiting via `@nestjs/throttler` (global + stricter auth endpoint limits)
- Helmet security headers
- Strict CORS allowlist — never wildcard in production
- Global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`
- `GlobalExceptionFilter` — never leaks stack traces in production
- Append-only audit log for all critical business events

---

## Background jobs (BullMQ queues)

| Queue                 | Purpose                                   |
| --------------------- | ----------------------------------------- |
| `email`               | All outbound email delivery               |
| `notifications`       | In-app notification dispatch              |
| `pdf`                 | Quotation, invoice, report PDF generation |
| `reports`             | Large report exports                      |
| `exports`             | CSV/Excel data exports                    |
| `document-processing` | File processing, checksum verification    |
| `maintenance`         | Overdue maintenance alerts                |
| `warranty`            | Warranty expiry alerts                    |
| `analytics`           | Analytics aggregation                     |

---

## API conventions

- Base: `/api/v1/<resource>`
- Authentication: `Authorization: Bearer <jwt>`
- Response envelope: `{ success, data, meta?, message?, errors? }`
- Pagination: `?page=1&limit=20&sortBy=createdAt&sortOrder=desc&search=`
- Errors: `{ success: false, statusCode, message, path, timestamp }`
- All UUIDs validated by `ParseUUIDPipe` before reaching service layer
