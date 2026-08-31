# Green Ngoria — Database Reference

## Stack

- **Database:** PostgreSQL (hosted on Supabase)
- **ORM:** Prisma 5
- **Schema file:** `prisma/schema.prisma`

## Conventions

| Convention        | Rule                                                                                |
| ----------------- | ----------------------------------------------------------------------------------- |
| Primary keys      | UUID (`@default(uuid())`)                                                           |
| Timestamps        | `createdAt`, `updatedAt` on all entities                                            |
| Soft deletion     | `deletedAt DateTime?` on auditable entities; queries must include `deletedAt: null` |
| Enums             | Defined in schema, imported from `@prisma/client`                                   |
| Currency          | Stored as `DECIMAL(15,2)` with separate `currency` enum field                       |
| Rates/percentages | `DECIMAL(5,2)`                                                                      |
| JSON blobs        | `Json?` type for flexible data (assessment circuits, specs, work order parts)       |
| Reference numbers | Application-generated (not DB sequences) via `generate-reference.util.ts`           |

## Migrations workflow

```bash
# Create migration (never edit generated migrations)
npx prisma migrate dev --name <description>

# Apply to production
npx prisma migrate deploy

# Generate Prisma client after schema changes
npx prisma generate

# Inspect current DB state
npx prisma studio
```

## Key indexes

All `organizationId`, `clientId`, `projectId`, `status`, `createdAt`, reference numbers, `email`, `serialNumber`, `SKU` fields are indexed.

## Transaction boundaries

Transactions are required for:

- Quotation approval (status change + audit + notification)
- Contract creation (contract + project linkage + audit)
- Invoice/payment (invoice status + payment record)
- Procurement approval (requisition + PO creation)
- Commissioning approval (all tests passed check + status update)
- Project state transitions
- User creation with role assignment
- Password reset (hash update + session revocation)

## Soft deletion

Entities with `deletedAt`:

- `User`, `Organization`, `Client`, `Lead`, `Project`, `Quotation`, `Contract`, `Invoice`, `Equipment`, `SparePart`, `Asset`, `EngineeringDocument`, `Vendor`

Hard-deleted (no audit concern):

- `RfqAttachment`, `TicketMessage`, `QuotationItem`, `InvoiceItem` (cascade with parent)

## Audit log

The `AuditLog` table is **append-only**. No `UPDATE` or `DELETE` operations are ever issued against it. Every write goes through `AuditService.log()`.

## Domain model summary

```
Organization (tenant boundary)
  ├── OrganizationMember → User
  ├── Client
  │   ├── ClientContact
  │   ├── Lead → CrmActivity, Consultation, PlantAssessment
  │   ├── Project
  │   │   ├── ProjectMilestone, ProjectTask, ProjectRisk
  │   │   ├── EngineeringDocument
  │   │   ├── ProcurementRequisition → ProcurementQuote, PurchaseOrder
  │   │   ├── SiteReport, HseIncident
  │   │   ├── CommissioningSystem → CommissioningTest
  │   │   └── Asset → MaintenanceWorkOrder, Warranty
  │   ├── Rfq → RfqItem
  │   ├── Quotation → QuotationItem, QuotationRevision
  │   ├── Contract → ContractMilestone
  │   └── Invoice → InvoiceItem → Payment
  ├── Vendor
  ├── Notification
  └── AuditLog

Equipment → SparePart
PlantAssessment → AssessmentFinding → AssessmentRecommendation
SupportTicket → TicketMessage, TicketAttachment

CMS: CmsPage, CmsService, CmsCaseStudy, CmsArticle
RBAC: Role, Permission, RolePermission, UserRole
Sessions: UserSession
```
