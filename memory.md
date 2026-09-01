# Project Memory — Green Ngoria Supplies Limited

## Core Identity & Positioning
- **Primary Business**: Mining, mineral processing, engineering, construction and commissioning of mining plants (emphasis on gold CIP/CIL systems).
- **Secondary/Supporting Capabilities**: Gemstone mining, civil & building works, mechanical & electrical engineering, importation and supplies.
- **Enterprise Lifecycle**:
  `Mining Opportunity → Lead → Consultation → Plant Assessment → Engineering → RFQ → Quotation → Contract → Project → Procurement → Construction → Installation → Commissioning → Handover → Operations Support → Maintenance`

---

## Role-Based Dashboards & Departmental Boundaries
- **Sales Workspace** (`SALES_MANAGER`, `CRM_OFFICER`, `CUSTOMER_CARE`):
  - Dedicated dashboard with pipeline value, today's sales (ERP + POS), win rates, sales funnel velocity, high-value quotation approvals, and revenue trajectory.
  - Sidebar and routes restricted to Sales & CRM, Quotations, POS, Customers, Debt, Expenses, and Store Management.
- **Project Delivery Workspace** (`PROJECT_MANAGER`, `SITE_SUPERVISOR`, `PRODUCTION_MANAGER`):
  - Dedicated dashboard with active plant projects, milestone schedule health, workforce on shift, open punch lists, phase completion bars, daily safe man-hours, and critical path milestones.
  - Sidebar and routes restricted to Projects, Site Operations, Daily Logs, HSE, Commissioning, Vendors, and Procurement Requisitions.
- **Mining & Engineering Workspace** (`MINING_ENGINEER`, `PROCESS_ENGINEER`, etc.):
  - Dedicated dashboard with plant assessment queue, controlled P&IDs, test pass rates, asset uptime, 24hr CIP/CIL leaching & carbon adsorption kinetics curves, and metallurgy breakdown.
  - Sidebar and routes restricted to Plant Assessments, P&IDs/Engineering Document Control, Mining Sites, Vat Leach Kinetics, Equipment Specs, Spares, Commissioning, and Plant Assets.
- **Enterprise Executive Overview** (`SUPER_ADMIN`, `ADMIN`, `DIRECTOR`):
  - Consolidated view across all 9 connected business systems, with an interactive role perspective switcher allowing super admins to inspect any departmental view.

---

## Verification Commands
- `pnpm --filter green-ngoria-web typecheck`
- `pnpm --filter green-ngoria-web test`
- `pnpm --filter green-ngoria-web build`
- `pnpm test`
- `pnpm test:e2e`
