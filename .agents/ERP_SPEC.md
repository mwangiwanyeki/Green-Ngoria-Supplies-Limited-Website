# Green Ngoria Operations ERP — spec derived from the live dashboard recording

Source: screen recording of the company's current admin dashboard (`project-2-c3700.web.app`),
a live system holding real data. This spec captures every navigation item, route, page and
visible metric observed, so the new Next.js/NestJS platform can absorb the same capability.

**Relationship to the existing codebase:** the current repo covers the *engineering-services*
side (leads, quotations, RFQs, projects, plant assessments, commissioning, HSE, contracts,
procurement, equipment). This ERP covers the *operations / trading* side (POS, inventory, sales,
debt, expenses, accounts, suppliers, gold-processing operations, HR, visitors). They are
**complementary and must coexist** — the new admin is the superset of both.

## Global shell

- **Brand:** "Green Ngoria" wordmark + logo, deep-green sidebar (`#0B5D33`-ish), light content area.
- **Branch switcher** at the top of the sidebar under a `BRANCH` label. Observed branches:
  - `Green Ngoria LTD` (default/selected)
  - `STANDARD IMPROVEMENT COMPANY`
  Every module's data is scoped to the selected branch. Settings notes: "each branch can have its
  own … contact info".
- **Header actions (right):** dark-mode toggle (moon icon), messages/mail icon, notifications bell
  with unread count badge (observed: `30`), profile avatar button.
- **Mobile bottom tab bar:** Home · POS · Inventory · Today · Expenses.
- **Routing style:** hash routes (`#pos`, `#inventory`, …). In the rebuild these become real
  paths under `/admin/…`.
- Sub-navigation items carry status pills: `UPDATED` (blue) and `NEW` (yellow).

## Sidebar navigation (complete, in order)

| # | Item | Children | Observed route |
|---|---|---|---|
| 1 | Dashboard | — | `#dashboard` |
| 2 | Sales *(group)* | Inventory · POS `UPDATED` · Today Sales | `#inventory`, `#pos`, `#today-sales` |
| 3 | All Sales | — | `#all-sales` |
| 4 | Store Management | — | `#store-management` |
| 5 | Debt Management *(group)* | Customers · Manage Debt | `#customers`, `#manage-debt` |
| 6 | Expenses | — | `#expenses` |
| 7 | Accounts | — | `#accounts` |
| 8 | Orders *(group)* | Suppliers (+ purchase orders) | `#suppliers` |
| 9 | Operations Control *(group)* | Vat Leach `UPDATED` · Stock Pile `NEW` · Security `NEW` | `#operations-vat-leach` |
| 10 | HR Statistics *(group)* | Overview · Manage Staffs · Payroll `UPDATED` · Leave Management | `#hr-manage-staff`, `#hr-payroll`, `#hr-leave` |
| 11 | Visitors Management | — | `#visitors-management` |
| 12 | Reports | — | `#reports` |
| 13 | Company Portal | — | `#company-portal` |
| 14 | Admin Panel | — | `#admin-panel` |
| 15 | Settings | — | `#settings` |
| 16 | Activity Logs | — | `#activity-logs` |

## Module detail

### Inventory (`#inventory`)
- Header actions: **Export**, **Price Tags**, **+ Add Item**.
- Hero stat card "STOCK ON HAND": total value `KSh 58,430,700`, `IN STOCK 393`, `OUT OF STOCK 25`.
- Search: "search by name, SKU, category…". Filter chips: All / **Low Stock** / **Out of Stock**.
- Table columns: Item · SKU · Category · (price) · (qty) · actions.
- Observed items: `Adjustable sliding …` KSh 800 / 285 pcs; `Air Cleaner-ZH1100` KSh 1,200 / 100 pcs;
  `Air needle-Y28` KSh 500; `Air pick-G15` KSh 18,000 / 24 pcs; `Alternator-STC-15` KSh 90,000 / 9 pcs;
  `Alternator-STC-30`; `… Tower … Spring-…` SKU `GN-2026-…` category `Spare Parts`.
- SKU format: `GN-<year>-<seq>`. Categories include **Spare Parts**.
- 454 total inventory items (per Reports).

### POS (`#pos`)
- Product grid with card per item showing name, price in KSh, remaining pcs.
- Marked `UPDATED` in nav — the most actively developed screen.

### Today Sales (`#today-sales`)
- Stat card: TODAY (total), AVG. SALE, (count) SALES.
- "Manage Balances" section; search "customer, item…"; a status/type dropdown filter.

### All Sales (`#all-sales`)
- Full sales history list (card/table rows).

### Store Management (`#store-management`)
- Stores/locations and stock placement.

### Debt Management → Customers (`#customers`) / Manage Debt (`#manage-debt`)
- Customer records and outstanding credit. Reports show **Outstanding Debt KSh 6,763,499**,
  `3 overdue`, `5 customers`.

### Expenses (`#expenses`)
- Expense entry and history. Reports show **Total Expenses KSh 522,940** across `27 records`.

### Accounts (`#accounts`)
- Account balances with a **Manual Entry** action and an **+ Add New** button; supports manual
  ledger entries.

### Orders → Suppliers (`#suppliers`)
- Stat cards: **Total Orders**, **Order Value KSh 34,500**, **Pending Orders 1**.
- Search "name, phone, email, company…"; category dropdown ("All Categories").
- Table: `#` · SUPPLIER NAME (sortable) · PHONE · COMPANY · … Pagination "Showing 1–1 of 1 supplier",
  rows-per-page selector (15), numbered pager.

### Operations Control → Vat Leach (`#operations-vat-leach`)
> Gold-processing operations. The company rents out **vat leach** tanks to miners at the Bondo
> plant; this module tracks renters, deposits and payments.
- Stat card: **KSh 0 Deposits Held**.
- Tabs: (assignments) · **Payment Reminders** · **Payment History**.
- Search: "renter, vat, phone, location…"; a status dropdown.
- Table: "Vat Leaches Assigned" …; pagination "Showing 0-0 of 0 records", rows 25, Prev / Page 1/1 / Next.

### Operations Control → Stock Pile (`#stock-pile`) `NEW`
- Ore stockpile tracking (tonnage, grade, location, movements).

### Operations Control → Security (`#security`) `NEW`
- Site security logging / incidents / guard shifts.

### HR Statistics → Overview (`#hr-overview`)
- Aggregate headcount and HR KPIs.

### HR Statistics → Manage Staffs (`#hr-manage-staff`)
- Stat cards incl. total staff, "…d In" (checked-in), "… Staff", "… Users".

### HR Statistics → Payroll (`#hr-payroll`) `UPDATED`
- Stat cards: `Staff (This Month)`, `Paid (Last Month)`, `Due This Month` (KSh), `Paid Last Month`
  (KSh), `Total Paid` (KSh).
- Filters: search by staff name · Month (e.g. August) · Year (e.g. 2026) · All Status ·
  All Payment Terms.

### HR Statistics → Leave Management (`#hr-leave`)
- Stat cards: Approved · Denied · On Leave Now · **Overdue** · This Month.
- Search "name, type or reason…". Filter chips: All / Pending / Approved / Denied / Overdue.
  Type dropdown ("All Types").
- Table: Staff Member · Period (`2026-07-27 to 2026-08-03`) · Actions (view, history icons).

### Visitors Management (`#visitors-management`)
- **Register Visitor** modal — fields: `FULL NAME *`, `ID / PASSPORT NO.` (National ID / Passport),
  `PHONE NUMBER` (+254…), `COMPANY / ORGANIZATION`, … with Cancel / **Register Visitor** actions.
- Implies check-in/check-out, host, purpose, badge.

### Reports (`#reports`)
- Date range chips: Today · Yesterday · This Week · **This Month** · Custom.
- **Generate Report** button (export).
- Tabs: **Overview** · Sales · Expenses · Inventory · (more, horizontally scrollable).
- Overview KPI card (observed live values):
  | Metric | Value |
  |---|---|
  | Total Revenue | KSh 5,347,150 (73 orders) |
  | Total Expenses | KSh 522,940 (27 records) |
  | Net Profit | KSh 4,824,210 (90.2% margin) |
  | Avg Order Value | KSh 73,248.63 |
  | Stock Value | KSh 58,430,700 (454 items) |
  | Outstanding Debt | KSh 6,763,499 (3 overdue) |
  | Low / Out of Stock | 36 / 25 (of 454) |
  | Customers | 5 (0 staff) |
- Chart: **Revenue vs Expenses (Monthly)**, y-axis to ~KSh 7,000k.

### Company Portal (`#company-portal`)
- Client/partner-facing portal surface.

### Admin Panel (`#admin-panel`)
- User/role administration.

### Settings (`#settings`)
Tab strip (icons): Business Profile · Price Tags/Labels · Categories · (pencil/customise) ·
Receipts · Appearance/Theme · General · Users/Session.
- **Business Profile** — per-branch: business name, system name ("… Management System"), phone
  (`xxx xxx xxx`), email, county/address, **Upload Logo** / **Remove**. Copy: "…for this branch —
  each branch can have its own … and contact info".
- **General Settings** — "System-wide preferences for currency, tax and stock alerts":
  `Currency Symbol` (KSh, "Used in all monetary displays"), `Tax Rate (%)` (0, "Applied to sales if
  enabled"), `Low Stock Threshold` (10, "Default reorder alert level for new inventory items"),
  **Save General Settings**.
- **Session Security** — "Automatically sign users out after a period of inactivity":
  `Auto Logout When Idle` toggle (on) — "Ends the session if there is no mouse, keyboard or touch
  activity"; `Logout after` preset chips: 5 min · 10 min · 15 min · 30 min · 1 hr · **2 hr**;
  `… Timeout (minutes)` numeric ("between 1 and 480 minutes"); `Warning Countdown (seconds)`
  ("between 10 and 300 seconds").

### Activity Logs (`#activity-logs`)
- Audit trail of user actions. (Repo already has an `AuditLog` model + `AuditService` to build on.)

## Cross-cutting requirements

1. **Multi-branch scoping** — a `Branch` concept nested under the existing `Organization`; all ERP
   records carry `branchId`; the switcher changes the active scope.
2. **Currency** — KES/KSh everywhere; use `Decimal` for money, never floats.
3. **Status pills** — `NEW` / `UPDATED` badges are data-driven in the nav config.
4. **Idle auto-logout** — client-side inactivity timer with warning countdown, configurable per the
   Session Security settings; must integrate with the existing refresh-token/session model.
5. **Dark mode** — header toggle; the web app already has a theme system to hook into.
6. **Every list** — search box, filter chips/dropdowns, sortable columns, rows-per-page selector,
   numbered pagination, empty state, and an export action where the original had one.
