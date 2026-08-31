# AGENTS.md --- Green Ngoria Supplies Limited

## Enterprise Mining, Mineral Processing & Mining-Plant Platform

### 1. Product identity and business priority

This repository powers the enterprise digital platform for **Green
Ngoria Supplies Limited**.

The primary business positioning for the new platform is:

> **Mining, mineral processing, engineering, construction and
> commissioning of mining plants, with particular emphasis on
> gold-processing facilities and CIP/CIL systems.**

The legacy company profile also documents gemstone mining, civil works,
building works, mechanical and electrical engineering, supplies,
logistics, petroleum-related activities and timber products. These
capabilities may be represented where commercially relevant, but they
must **not dilute the core positioning of Green Ngoria as a mining and
mining-plant engineering/construction company**.

The uploaded company profile states that Green Ngoria was incorporated
in September 2011 and was formed around gold and gemstone mining, civil
works, building works, importation and supplies. It also describes
qualified engineers, construction/supervision capability, mechanical and
electrical engineering, and experience across East and Central Africa.
fileciteturn6file1L143-L159

The profile records mining activity in Bondo, Siaya County and Taita
Taveta, as well as gemstone interests in Kenya and Tanzania and
investment in gold-mining opportunities. fileciteturn6file0L13-L18
fileciteturn6file5L469-L480

### 2. Core digital lifecycle

The platform must connect:

**Mining Opportunity → Client/Investor Lead → Consultation → Technical
Plant Assessment → Feasibility/Engineering → RFQ → Quotation → Contract
→ Project → Procurement → Construction → Installation → Commissioning →
Handover → Operations Support → Maintenance → After-Sales**

Do not build disconnected mini-applications. Every system must share
authenticated identity, organizations, projects, documents, activities,
notifications, audit events and business references.

### 3. Stack

- Backend: NestJS 11 + Express + TypeScript
- Frontend: Next.js + TypeScript + React + Tailwind CSS + Framer
  Motion
- Database: PostgreSQL / Supabase
- ORM: Prisma
- Cache/queues: Redis + BullMQ when justified
- Object storage: private project/document storage
- API: `api.greenngoria.com`
- Public site: `greenngoria.com`
- Client portal: `portal.greenngoria.com`
- Admin: `admin.greenngoria.com`

### 4. NestJS architecture rules

Always apply NestJS-first patterns.

Never instantiate services manually: - no `new PrismaClient()` in
feature code - no `new SomeService()` - use constructor dependency
injection

Infrastructure integrations get dedicated modules/services:

```text
src/lib/database/prisma.module.ts
src/lib/database/prisma.service.ts
src/lib/mail/mail.module.ts
src/lib/mail/mail.service.ts
src/lib/storage/
src/lib/queue/
src/lib/notifications/
src/lib/audit/
```

Infrastructure modules should be `@Global()` when appropriate and
imported once in `AppModule`.

Feature modules belong under:

```text
src/module/<feature>/
```

Shared guards, decorators, pipes, interceptors, filters and middleware
belong under:

```text
src/common/
```

Use Nest CLI:

```bash
nest g module <name>
nest g service <name>
nest g controller <name>
```

### 5. Recommended domain modules

```text
src/module/
├── auth/
├── users/
├── organizations/
├── clients/
├── leads/
├── crm/
├── consultations/
├── plant-assessments/
├── mining-sites/
├── mineral-projects/
├── feasibility/
├── engineering/
├── projects/
├── equipment/
├── spares/
├── rfqs/
├── quotations/
├── contracts/
├── procurement/
├── vendors/
├── inventory/
├── deliveries/
├── site-operations/
├── hse/
├── inspections/
├── commissioning/
├── handover/
├── assets/
├── maintenance/
├── warranties/
├── support/
├── finance/
├── invoices/
├── payments/
├── documents/
├── cms/
├── media/
├── analytics/
├── notifications/
└── reports/
```

### 6. Nine connected business systems

#### System 1 --- Client & Project Management

Manage: - organizations and client contacts - mining/investor profiles -
opportunities - project awards - contracts - project phases -
milestones - tasks - deliverables - project risks - issues - approvals -
project communication - construction progress - commissioning -
handover - support

Project lifecycle: **Award → Planning → Engineering → Procurement →
Construction → Installation → Commissioning → Handover → Support**

#### System 2 --- Equipment, Spares, RFQ & Quotation

Turn equipment into a genuine B2B sales channel: - equipment catalogue -
plant equipment categories - equipment specifications - technical
datasheets - spare parts - consumables - availability - RFQ builder -
attachments - supplier sourcing - quote comparison - quotation
revisions - approval workflow - PDF quotations - conversion to
procurement/order workflow

#### System 3 --- CRM + CMS + Operations

Manage: - leads - contacts - opportunities - consultations -
activities - follow-ups - pipeline - sales ownership - website pages -
equipment content - services - case studies - blog/technical insights -
media - SEO metadata - operational KPIs

CRM pipeline: **New → Qualified → Consultation → Assessment → RFQ →
Quotation → Negotiation → Won/Lost**

#### System 4 --- Technical Plant Assessment & Optimization

This is a core Green Ngoria differentiator.

Collect: - client/project context - mining location - mineral/ore type -
estimated production capacity - ore characteristics - existing plant -
existing process flow - recovery/performance information -
crushing/grinding - leaching - adsorption - elution/recovery -
tailings - water - power - utilities - equipment condition - operational
bottlenecks - environmental constraints - HSE constraints -
documentation/photos - client objectives

Assessment workflow: **Project → Site → Mineral/Ore → Existing Plant →
Process → Equipment → Performance → Challenges → Attachments → Review →
Submit**

Generate a qualified technical opportunity, assessment reference and
follow-up workflow.

Do not present automated calculations or AI output as certified
engineering advice. Professional engineering review remains mandatory.

#### System 5 --- Engineering Document Control

Support: - P&IDs - process flow diagrams - layouts - equipment
datasheets - specifications - technical reports - calculations -
drawings - revisions - approvals - transmittals - document status -
controlled downloads - audit trail

#### System 6 --- Procurement, Vendor & Delivery

Support: **Requisition → Approval → Supplier RFQ → Supplier Quotes →
Comparison → Selection → PO → Delivery → Receipt**

Track: - vendor profiles - vendor qualification - sourcing - technical
compliance - commercial comparison - lead time - delivery - receiving -
exceptions

#### System 7 --- Contracts, Finance, Invoicing & Payments

Support: - contracts - commercial terms - payment milestones -
invoices - receipts - payments - balances - approvals - financial
reporting

Clients see only authorized financial records.

#### System 8 --- Site Operations, HSE, Inspection & Commissioning

Support: - daily site reports - workforce - construction activities -
progress - photos - HSE observations - incidents - inspections -
non-conformance reports - punch lists - commissioning checklists - test
results - acceptance - handover

The company profile specifically emphasizes Environment, Health and
Safety, risk awareness, training, objectives/targets, employee
participation and continuous improvement.
fileciteturn6file3L343-L357

#### System 9 --- Assets, Maintenance, Warranty & After-Sales

Support: - plant asset register - equipment identity - serial numbers -
project/location - installation date - warranty - service history -
preventive maintenance - corrective maintenance - work orders - parts -
warranty claims - customer support

### 7. Mining-specific data model

Design first-class entities for: - MiningSite - MineralProject -
MineralType - OreBody/Deposit reference - ProcessingPlant - PlantStage -
ProcessCircuit - Equipment - EquipmentSpecification - SparePart -
TechnicalAssessment - AssessmentFinding - OptimizationRecommendation -
EngineeringDocument - CommissioningTest - Asset - MaintenanceWorkOrder

Avoid creating a misleading geological-reserve model unless qualified
business requirements are supplied.

### 8. Business profile content

The profile describes Green Ngoria's vision around responsible,
internationally recognized mining and sustainable development in Kenya,
Tanzania and East Africa, with environmental protection and community
wellbeing as important themes. fileciteturn6file2L223-L251

It identifies these values: - Transparency - Accountability - Ethical
conduct - Teamwork - Integrity - Efficiency - Unity in diversity - Equal
opportunities - Environmental sustainability
fileciteturn6file2L239-L251

Use these values throughout the platform rather than inventing different
corporate values.

The profile describes a strong quality orientation and records ISO
9001:2015, ISO 14001:2015 and OHSAS 18001:2007
certifications/credentials. Treat these as **company-profile claims that
must be verified with current certificates before publishing as current
certifications**. fileciteturn6file1L111-L121

### 9. Engineering and construction positioning

Green Ngoria's documented construction capabilities include new
buildings, renovation, restoration, partitioning, finishes and painting.
fileciteturn6file5L481-L490

The profile also records road construction capabilities including site
clearance, sub-base/base formation, soil stabilization, asphaltic
concrete, surface dressing, overlays, bridges, culverts and storm
drainage. fileciteturn6file5L507-L514

Water-project capabilities include water supply, water reticulation,
water and sewerage projects. fileciteturn6file9L815-L817

Mechanical capability is described as including qualified engineers and
contract delivery. fileciteturn6file9L818-L827

Electrical capabilities include design/construct, commissioning and
maintenance support, electrical/instrumentation/communication services,
installations, testing, commissioning, preventive maintenance,
automation and energy-saving solutions. fileciteturn6file9L827-L853

These should be presented as **supporting engineering/construction
capabilities**, while mining and mining-plant delivery remain the
dominant commercial narrative.

### 10. Security

Mandatory: - strict CORS allowlist - Helmet/security headers - rate
limiting - DTO validation/whitelisting - secure authentication/session
handling - MFA for privileged users - RBAC - organization/resource-level
authorization - tenant isolation - private document access - signed URLs
where appropriate - upload MIME/size validation - malware scanning where
available - secret management - secure cookies/tokens - no secrets in
logs - audit trails - backup and recovery - dependency scanning -
production/staging separation

Critical audit events: - login/logout - failed authentication -
permission changes - organization membership - quotation approval -
contract changes - financial changes - document revisions - engineering
approvals - project state changes - procurement approvals - HSE
incidents - commissioning approvals - maintenance changes

### 11. API standards

Use: `/api/v1/<resource>`

Every endpoint should define: - DTO - validation - authorization -
pagination where applicable - filtering - sorting - consistent
response/error shape - OpenAPI documentation

Never expose password hashes, secrets, private storage keys or
unnecessary internal fields.

### 12. Database standards

Use: - PostgreSQL - Prisma - foreign keys - constraints - indexes -
enums/statuses - UUIDs where appropriate - createdAt/updatedAt - soft
deletion for auditable records - transactions for financial, approval
and state-transition workflows

### 13. Async processing

Use queues for: - email - notifications - report generation - PDF
quotations - exports - reminders - maintenance alerts - warranty
alerts - large document processing - analytics aggregation where
required

### 14. Testing

Minimum production quality: - unit tests - integration tests - E2E
tests - authorization tests - tenant-isolation tests - upload/security
tests - financial workflow tests - approval tests - project-state tests

### 15. Source-of-truth principle

The company profile is a source for historical/company information, but
**never fabricate**: - current projects - mining reserves - plant
capacities - recovery percentages - certifications - licenses - client
logos - equipment availability - prices - regulatory approvals

If a value is unknown, make it configurable in CMS/admin or mark it as
requiring client confirmation.

### 16. Session continuity

Required project-session behavior: - restore context before beginning
work when a project memory/continuity mechanism is available - save
meaningful implementation progress at the end of a work session - use
`/architect` for non-trivial work without a plan - use `/review` after
feature completion - use `/recover` when the failure is not obvious

Do not load unrelated skills merely because they exist.
