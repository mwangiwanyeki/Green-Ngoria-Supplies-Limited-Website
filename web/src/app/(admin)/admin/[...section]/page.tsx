import type React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CircleDot, Database, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { AdminSectionGuard } from '@/components/admin/admin-section-guard';
import dynamic from 'next/dynamic';
import { PageSkeleton } from '@/components/ui/skeleton';

const loader = () => <PageSkeleton />;

const AdminEquipmentList = dynamic(
  () =>
    import('@/features/admin/admin-equipment-list').then(
      (m) => m.AdminEquipmentList,
    ),
  { loading: loader },
);
const AdminFinanceList = dynamic(
  () =>
    import('@/features/admin/admin-finance-list').then(
      (m) => m.AdminFinanceList,
    ),
  { loading: loader },
);
const AdminHseList = dynamic(
  () => import('@/features/admin/admin-hse-list').then((m) => m.AdminHseList),
  { loading: loader },
);
const AdminProcurementList = dynamic(
  () =>
    import('@/features/admin/admin-procurement-list').then(
      (m) => m.AdminProcurementList,
    ),
  { loading: loader },
);
const AdminNotificationsList = dynamic(
  () =>
    import('@/features/admin/admin-notifications-list').then(
      (m) => m.AdminNotificationsList,
    ),
  { loading: loader },
);
const AdminAssessmentsList = dynamic(
  () =>
    import('@/features/admin/admin-assessments-list').then(
      (m) => m.AdminAssessmentsList,
    ),
  { loading: loader },
);
const AdminDashboard = dynamic(
  () =>
    import('@/features/admin/admin-dashboard').then((m) => m.AdminDashboard),
  { loading: loader },
);
const AdminAssetsList = dynamic(
  () =>
    import('@/features/admin/admin-assets-list').then((m) => m.AdminAssetsList),
  { loading: loader },
);
const AdminClientsList = dynamic(
  () =>
    import('@/features/admin/admin-clients-list').then(
      (m) => m.AdminClientsList,
    ),
  { loading: loader },
);
const AdminCommissioningList = dynamic(
  () =>
    import('@/features/admin/admin-commissioning-list').then(
      (m) => m.AdminCommissioningList,
    ),
  { loading: loader },
);
const AdminContractsList = dynamic(
  () =>
    import('@/features/admin/admin-contracts-list').then(
      (m) => m.AdminContractsList,
    ),
  { loading: loader },
);
const AdminEngineeringList = dynamic(
  () =>
    import('@/features/admin/admin-engineering-list').then(
      (m) => m.AdminEngineeringList,
    ),
  { loading: loader },
);
const AdminLeadsList = dynamic(
  () =>
    import('@/features/admin/admin-leads-list').then((m) => m.AdminLeadsList),
  { loading: loader },
);
const AdminProjectsList = dynamic(
  () =>
    import('@/features/admin/admin-projects-list').then(
      (m) => m.AdminProjectsList,
    ),
  { loading: loader },
);
const AdminQuotationsList = dynamic(
  () =>
    import('@/features/admin/admin-quotations-list').then(
      (m) => m.AdminQuotationsList,
    ),
  { loading: loader },
);
const AdminUsersList = dynamic(
  () =>
    import('@/features/admin/admin-users-list').then((m) => m.AdminUsersList),
  { loading: loader },
);
const AdminAuditList = dynamic(
  () =>
    import('@/features/admin/admin-audit-list').then((m) => m.AdminAuditList),
  { loading: loader },
);
const AdminRolesList = dynamic(
  () =>
    import('@/features/admin/admin-roles-list').then((m) => m.AdminRolesList),
  { loading: loader },
);
const AdminOrganizationsList = dynamic(
  () =>
    import('@/features/admin/admin-organizations-list').then(
      (m) => m.AdminOrganizationsList,
    ),
  { loading: loader },
);
const AdminConsultationsList = dynamic(
  () =>
    import('@/features/admin/admin-consultations-list').then(
      (m) => m.AdminConsultationsList,
    ),
  { loading: loader },
);
const AdminMiningSitesList = dynamic(
  () =>
    import('@/features/admin/admin-mining-sites-list').then(
      (m) => m.AdminMiningSitesList,
    ),
  { loading: loader },
);
const AdminVendorsList = dynamic(
  () =>
    import('@/features/admin/admin-vendors-list').then(
      (m) => m.AdminVendorsList,
    ),
  { loading: loader },
);
const AdminSparesList = dynamic(
  () =>
    import('@/features/admin/admin-spares-list').then((m) => m.AdminSparesList),
  { loading: loader },
);
const AdminRfqsList = dynamic(
  () => import('@/features/admin/admin-rfqs-list').then((m) => m.AdminRfqsList),
  { loading: loader },
);
const AdminSiteOpsList = dynamic(
  () =>
    import('@/features/admin/admin-site-ops-list').then(
      (m) => m.AdminSiteOpsList,
    ),
  { loading: loader },
);
const AdminMaintenanceList = dynamic(
  () =>
    import('@/features/admin/admin-maintenance-list').then(
      (m) => m.AdminMaintenanceList,
    ),
  { loading: loader },
);
const AdminWarrantiesList = dynamic(
  () =>
    import('@/features/admin/admin-warranties-list').then(
      (m) => m.AdminWarrantiesList,
    ),
  { loading: loader },
);
const AdminSupportList = dynamic(
  () =>
    import('@/features/admin/admin-support-list').then(
      (m) => m.AdminSupportList,
    ),
  { loading: loader },
);
const AdminCmsList = dynamic(
  () => import('@/features/admin/admin-cms-list').then((m) => m.AdminCmsList),
  { loading: loader },
);
const AdminMediaList = dynamic(
  () =>
    import('@/features/admin/admin-media-list').then((m) => m.AdminMediaList),
  { loading: loader },
);
const AdminInventory = dynamic(
  () =>
    import('@/features/admin/erp/admin-inventory').then(
      (m) => m.AdminInventory,
    ),
  { loading: loader },
);
const AdminPos = dynamic(
  () => import('@/features/admin/erp/admin-pos').then((m) => m.AdminPos),
  { loading: loader },
);
const AdminSales = dynamic(
  () => import('@/features/admin/erp/admin-sales').then((m) => m.AdminSales),
  { loading: loader },
);
const AdminStoreManagement = dynamic(
  () =>
    import('@/features/admin/erp/admin-store-management').then(
      (m) => m.AdminStoreManagement,
    ),
  { loading: loader },
);
const AdminCustomers = dynamic(
  () =>
    import('@/features/admin/erp/admin-customers').then(
      (m) => m.AdminCustomers,
    ),
  { loading: loader },
);
const AdminDebt = dynamic(
  () => import('@/features/admin/erp/admin-debt').then((m) => m.AdminDebt),
  { loading: loader },
);
const AdminExpenses = dynamic(
  () =>
    import('@/features/admin/erp/admin-expenses').then((m) => m.AdminExpenses),
  { loading: loader },
);
const AdminAccounts = dynamic(
  () =>
    import('@/features/admin/erp/admin-accounts').then((m) => m.AdminAccounts),
  { loading: loader },
);
const AdminSuppliers = dynamic(
  () =>
    import('@/features/admin/erp/admin-suppliers').then(
      (m) => m.AdminSuppliers,
    ),
  { loading: loader },
);
const AdminVatLeach = dynamic(
  () =>
    import('@/features/admin/erp/admin-vat-leach').then((m) => m.AdminVatLeach),
  { loading: loader },
);
const AdminStockPiles = dynamic(
  () =>
    import('@/features/admin/erp/admin-stock-piles').then(
      (m) => m.AdminStockPiles,
    ),
  { loading: loader },
);
const AdminSecurity = dynamic(
  () =>
    import('@/features/admin/erp/admin-security').then((m) => m.AdminSecurity),
  { loading: loader },
);
const AdminHrOverview = dynamic(
  () => import('@/features/admin/erp/admin-hr').then((m) => m.AdminHrOverview),
  { loading: loader },
);
const AdminHrStaff = dynamic(
  () => import('@/features/admin/erp/admin-hr').then((m) => m.AdminHrStaff),
  { loading: loader },
);
const AdminHrPayroll = dynamic(
  () => import('@/features/admin/erp/admin-hr').then((m) => m.AdminHrPayroll),
  { loading: loader },
);
const AdminHrLeave = dynamic(
  () => import('@/features/admin/erp/admin-hr').then((m) => m.AdminHrLeave),
  { loading: loader },
);
const AdminVisitors = dynamic(
  () =>
    import('@/features/admin/erp/admin-visitors').then((m) => m.AdminVisitors),
  { loading: loader },
);
const AdminReports = dynamic(
  () =>
    import('@/features/admin/erp/admin-reports').then((m) => m.AdminReports),
  { loading: loader },
);
const AdminActivityLogs = dynamic(
  () =>
    import('@/features/admin/erp/admin-activity-logs').then(
      (m) => m.AdminActivityLogs,
    ),
  { loading: loader },
);
const AdminSettings = dynamic(
  () =>
    import('@/features/admin/erp/admin-settings').then((m) => m.AdminSettings),
  { loading: loader },
);
const AdminProfile = dynamic(
  () => import('@/features/admin/admin-profile').then((m) => m.AdminProfile),
  { loading: loader },
);

function AdminInvoicesModule() {
  return <AdminFinanceList initialTab="invoices" />;
}

function AdminPaymentsModule() {
  return <AdminFinanceList initialTab="payments" />;
}

function AdminTodaySales() {
  return <AdminSales scope="today" />;
}

function AdminAllSales() {
  return <AdminSales scope="all" />;
}

// Modules with a real, data-wired list/dashboard component. Rendered in
// place of the generic placeholder scaffold below.
const wiredModules: Record<string, React.ComponentType> = {
  // Core Business & CRM
  leads: AdminLeadsList,
  clients: AdminClientsList,
  organizations: AdminOrganizationsList,
  consultations: AdminConsultationsList,

  // Commercial & Projects
  quotations: AdminQuotationsList,
  contracts: AdminContractsList,
  rfqs: AdminRfqsList,
  projects: AdminProjectsList,

  // Engineering & Delivery
  assessments: AdminAssessmentsList,
  engineering: AdminEngineeringList,
  equipment: AdminEquipmentList,
  spares: AdminSparesList,
  'mining-sites': AdminMiningSitesList,
  commissioning: AdminCommissioningList,

  // Operations & Sites
  'site-ops': AdminSiteOpsList,
  hse: AdminHseList,
  procurement: AdminProcurementList,
  vendors: AdminVendorsList,
  'vat-leach': AdminVatLeach,
  'stock-piles': AdminStockPiles,
  security: AdminSecurity,

  // Asset Lifecycle & Support
  assets: AdminAssetsList,
  maintenance: AdminMaintenanceList,
  warranties: AdminWarrantiesList,
  support: AdminSupportList,

  // Sales & ERP Operations
  inventory: AdminInventory,
  pos: AdminPos,
  'today-sales': AdminTodaySales,
  'all-sales': AdminAllSales,
  'store-management': AdminStoreManagement,
  customers: AdminCustomers,
  'manage-debt': AdminDebt,
  expenses: AdminExpenses,
  accounts: AdminAccounts,
  suppliers: AdminSuppliers,

  // Finance
  invoices: AdminInvoicesModule,
  payments: AdminPaymentsModule,

  // HR
  'hr/overview': AdminHrOverview,
  'hr/staff': AdminHrStaff,
  'hr/payroll': AdminHrPayroll,
  'hr/leave': AdminHrLeave,
  visitors: AdminVisitors,

  // Analytics, CMS & Admin
  analytics: AdminDashboard,
  reports: AdminReports,
  notifications: AdminNotificationsList,
  cms: AdminCmsList,
  media: AdminMediaList,
  users: AdminUsersList,
  roles: AdminRolesList,
  audit: AdminAuditList,
  'company-portal': AdminOrganizationsList,
  'admin-panel': AdminUsersList,
  'activity-logs': AdminActivityLogs,
  settings: AdminSettings,
  profile: AdminProfile,
};

interface ModuleDefinition {
  title: string;
  description: string;
  records: string[];
  workflow: string[];
}

const modules: Record<string, ModuleDefinition> = {
  leads: {
    title: 'Lead Record',
    description:
      'Qualified mining, plant, equipment and investor opportunities connected to consultation and follow-up.',
    records: [
      'Contact and organization',
      'Source and opportunity context',
      'Pipeline status and owner',
      'Activities and consultations',
    ],
    workflow: [
      'Qualify',
      'Consult',
      'Assess',
      'Prepare RFQ',
      'Quote',
      'Win or close',
    ],
  },
  projects: {
    title: 'Project Record',
    description:
      'Controlled mining-plant delivery record from award through handover and operational support.',
    records: [
      'Scope and client',
      'Milestones and tasks',
      'Risks and documents',
      'Procurement and commissioning',
    ],
    workflow: [
      'Award',
      'Plan',
      'Engineer',
      'Procure',
      'Construct',
      'Commission',
      'Handover',
    ],
  },
  quotations: {
    title: 'Quotation Record',
    description:
      'Versioned commercial proposal with technical scope, line items, approvals and client issue history.',
    records: [
      'Client and RFQ link',
      'Scope and exclusions',
      'Pricing and tax',
      'Revision and approval history',
    ],
    workflow: [
      'Draft',
      'Submit internally',
      'Approve',
      'Send',
      'Negotiate',
      'Accept or reject',
    ],
  },
  analytics: {
    title: 'Operational Analytics',
    description:
      'Cross-system indicators for the connected mining opportunity, commercial and delivery lifecycle.',
    records: [
      'CRM pipeline',
      'Assessment workload',
      'Project health',
      'Commercial position',
    ],
    workflow: [
      'Select period and organization',
      'Review exceptions',
      'Open source records',
      'Export reviewed report',
    ],
  },
  clients: {
    title: 'Clients & Organizations',
    description:
      'Organization-scoped client accounts, contacts, mining interests and linked commercial records.',
    records: [
      'Client profiles',
      'Authorized contacts',
      'Mining interests',
      'Project and quotation links',
    ],
    workflow: [
      'Create client',
      'Verify contacts',
      'Qualify requirements',
      'Connect opportunity or project',
    ],
  },
  organizations: {
    title: 'Organizations',
    description:
      'Client organization accounts, membership, portal access and linked commercial and project records.',
    records: [
      'Organization profile',
      'Membership and portal users',
      'Linked leads, projects and invoices',
      'Status and account tier',
    ],
    workflow: [
      'Register organization',
      'Verify details',
      'Invite portal users',
      'Link commercial records',
      'Review activity',
    ],
  },
  consultations: {
    title: 'Technical Consultations',
    description:
      'Structured consultation records that convert qualified leads into assessable technical opportunities.',
    records: [
      'Objectives',
      'Site context',
      'Participants',
      'Actions and follow-ups',
    ],
    workflow: [
      'Schedule',
      'Prepare',
      'Record findings',
      'Assign actions',
      'Convert to assessment or RFQ',
    ],
  },
  'mining-sites': {
    title: 'Mining Sites',
    description:
      'First-class site records for location, mineral context, access, infrastructure and operational constraints.',
    records: [
      'Location and ownership context',
      'Mineral types',
      'Access and logistics',
      'Utilities and constraints',
    ],
    workflow: [
      'Register site',
      'Verify context',
      'Link mineral project',
      'Attach assessment',
    ],
  },
  assessments: {
    title: 'Plant Assessments',
    description:
      'Multi-stage technical assessment from project and site context through reviewed findings and recommendations.',
    records: [
      'Plant and process data',
      'Equipment condition',
      'Performance findings',
      'Recommendations and evidence',
    ],
    workflow: [
      'Draft',
      'Submit',
      'Engineering review',
      'Clarification',
      'Approve findings',
      'Create opportunity',
    ],
  },
  engineering: {
    title: 'Engineering Document Control',
    description:
      'Controlled drawings, specifications, datasheets, revisions, transmittals and approvals.',
    records: [
      'P&IDs and flowsheets',
      'Layouts and drawings',
      'Specifications',
      'Revision and approval history',
    ],
    workflow: [
      'Create record',
      'Upload revision',
      'Review',
      'Approve or reject',
      'Issue controlled copy',
    ],
  },
  commissioning: {
    title: 'Commissioning',
    description:
      'System-based test plans, results, evidence, qualified approvals and handover readiness.',
    records: [
      'Commissioning systems',
      'Test procedures',
      'Readings and evidence',
      'Approvals and punch items',
    ],
    workflow: [
      'Pre-check',
      'Test',
      'Resolve failures',
      'Retest',
      'Approve',
      'Handover',
    ],
  },
  hse: {
    title: 'HSE Management',
    description:
      'Site observations, incidents, inspections, corrective actions and auditable closure.',
    records: [
      'Observations',
      'Incidents',
      'Immediate actions',
      'Investigation and closure',
    ],
    workflow: [
      'Report',
      'Triage severity',
      'Investigate',
      'Correct',
      'Verify',
      'Close',
    ],
  },
  equipment: {
    title: 'Equipment Catalogue',
    description:
      'Technical equipment records with applications, specifications, documents and controlled publication.',
    records: [
      'Categories and applications',
      'Technical specifications',
      'Datasheets',
      'Publication state',
    ],
    workflow: [
      'Draft equipment',
      'Technical review',
      'Publish',
      'Receive RFQ',
      'Revise when required',
    ],
  },
  spares: {
    title: 'Spares Catalogue',
    description:
      'Traceable spare parts linked to equipment, stock context and RFQ workflows.',
    records: [
      'Part identity',
      'Compatible equipment',
      'Stock context',
      'Technical documents',
    ],
    workflow: [
      'Register part',
      'Verify compatibility',
      'Publish',
      'Quote',
      'Link to asset maintenance',
    ],
  },
  rfqs: {
    title: 'Requests for Quotation',
    description:
      'Client and internal RFQs with line items, attachments, submission state and commercial conversion.',
    records: [
      'RFQ header',
      'Line items',
      'Technical attachments',
      'Submission and response dates',
    ],
    workflow: ['Draft', 'Validate', 'Submit', 'Clarify', 'Quote', 'Close'],
  },
  contracts: {
    title: 'Contracts',
    description:
      'Controlled commercial terms, milestones, approvals and project linkage.',
    records: [
      'Contract parties',
      'Scope and value',
      'Payment milestones',
      'Approval and signature dates',
    ],
    workflow: [
      'Draft',
      'Internal review',
      'Approve',
      'Sign',
      'Activate',
      'Complete',
    ],
  },
  procurement: {
    title: 'Procurement',
    description:
      'Connected requisitions, supplier RFQs, comparisons, approvals, purchase orders and delivery status.',
    records: [
      'Requisitions',
      'Supplier quotations',
      'Technical/commercial comparison',
      'Purchase orders',
    ],
    workflow: [
      'Request',
      'Approve',
      'Source',
      'Compare',
      'Select',
      'Order',
      'Receive',
    ],
  },
  vendors: {
    title: 'Vendors',
    description:
      'Supplier qualification, capabilities, compliance status and sourcing history.',
    records: [
      'Company profile',
      'Qualification status',
      'Categories',
      'Performance history',
    ],
    workflow: [
      'Register',
      'Due diligence',
      'Approve',
      'Source',
      'Review performance',
    ],
  },
  'site-ops': {
    title: 'Site Operations',
    description:
      'Daily construction progress, workforce, equipment, issues, photographs and next-day plans.',
    records: [
      'Daily reports',
      'Work areas',
      'Labour and equipment',
      'Issues and progress',
    ],
    workflow: [
      'Prepare report',
      'Supervisor review',
      'Resolve exceptions',
      'Update project progress',
    ],
  },
  invoices: {
    title: 'Invoices',
    description:
      'Organization-scoped invoices, line items, issue state, balances and payment allocation.',
    records: [
      'Invoice header',
      'Line items and tax',
      'Due dates',
      'Payment balance',
    ],
    workflow: [
      'Draft',
      'Approve',
      'Issue',
      'Receive payment',
      'Reconcile',
      'Close',
    ],
  },
  payments: {
    title: 'Payments',
    description:
      'Auditable receipts and payment allocations linked to approved invoices.',
    records: [
      'Amount and currency',
      'Method and reference',
      'Payment date',
      'Invoice allocation',
    ],
    workflow: ['Record', 'Verify', 'Allocate', 'Reconcile', 'Report'],
  },
  assets: {
    title: 'Asset Register',
    description:
      'Installed plant and equipment identity, location, commissioning and service history.',
    records: [
      'Asset and serial identity',
      'Project and location',
      'Installation date',
      'Warranty and service links',
    ],
    workflow: [
      'Register at handover',
      'Verify identity',
      'Activate',
      'Maintain',
      'Retire',
    ],
  },
  maintenance: {
    title: 'Maintenance',
    description:
      'Preventive and corrective work orders connected to assets, people, parts and completion evidence.',
    records: [
      'Work orders',
      'Maintenance type',
      'Parts and labour',
      'Completion and closure',
    ],
    workflow: [
      'Plan or report',
      'Assign',
      'Start',
      'Complete',
      'Verify',
      'Close',
    ],
  },
  warranties: {
    title: 'Warranties',
    description:
      'Warranty periods, terms, expiry monitoring and claims linked to installed assets.',
    records: [
      'Provider and terms',
      'Coverage period',
      'Documents',
      'Claims and outcome',
    ],
    workflow: ['Register', 'Monitor', 'Submit claim', 'Review', 'Resolve'],
  },
  support: {
    title: 'After-sales Support',
    description:
      'Prioritized client tickets, messages, ownership, resolution and asset/project context.',
    records: [
      'Ticket priority',
      'Client messages',
      'Assignment',
      'Resolution record',
    ],
    workflow: ['Open', 'Triage', 'Assign', 'Respond', 'Resolve', 'Close'],
  },
  cms: {
    title: 'Content Management',
    description:
      'Reviewed public pages, services, case studies and technical insights with SEO metadata.',
    records: [
      'Pages and services',
      'Case studies',
      'Technical articles',
      'Publication metadata',
    ],
    workflow: [
      'Draft',
      'Technical review',
      'Compliance review',
      'Approve',
      'Publish',
    ],
  },
  media: {
    title: 'Media Library',
    description:
      'Private and publishable media with ownership, project context and controlled access.',
    records: [
      'Files and metadata',
      'Usage rights',
      'Project links',
      'Publication status',
    ],
    workflow: ['Upload', 'Scan', 'Classify', 'Approve', 'Use or archive'],
  },
  users: {
    title: 'Users',
    description:
      'Account lifecycle, organization memberships, status, MFA and privileged access.',
    records: [
      'Identity and status',
      'Organization membership',
      'Roles and permissions',
      'Session activity',
    ],
    workflow: [
      'Invite',
      'Verify',
      'Assign least privilege',
      'Enforce MFA',
      'Review access',
    ],
  },
  roles: {
    title: 'Roles & Permissions',
    description:
      'Least-privilege access policies for commercial, engineering, finance, HSE and client users.',
    records: [
      'System roles',
      'Permission codes',
      'Role mappings',
      'Change history',
    ],
    workflow: [
      'Define need',
      'Approve access',
      'Assign',
      'Audit',
      'Remove when no longer required',
    ],
  },
  audit: {
    title: 'Audit Logs',
    description:
      'Append-only evidence for authentication, permissions, approvals and critical business changes.',
    records: [
      'Actor and organization',
      'Action and entity',
      'Before/after context',
      'Timestamp and request context',
    ],
    workflow: [
      'Filter',
      'Investigate',
      'Correlate records',
      'Export reviewed evidence',
    ],
  },
  settings: {
    title: 'Platform Settings',
    description:
      'Controlled organization, notification and operational defaults without exposing secrets.',
    records: [
      'Organization preferences',
      'Reference formats',
      'Notification rules',
      'Security policy state',
    ],
    workflow: ['Review', 'Change', 'Validate', 'Audit', 'Monitor'],
  },
};

export default async function AdminModulePage({
  params,
}: {
  params: Promise<{ section: string[] }>;
}) {
  const { section } = await params;
  const key = section[0];

  // Wired modules resolve by full sub-path first (e.g. "hr/overview"),
  // then by their leading segment (e.g. "inventory").
  const fullPath = section.join('/');
  const WiredModule =
    wiredModules[fullPath] ??
    (section.length === 1 ? wiredModules[key] : undefined);
  if (WiredModule) {
    return (
      <AdminSectionGuard>
        <WiredModule />
      </AdminSectionGuard>
    );
  }

  // Fall back to the static record scaffold for engineering placeholders.
  const module = modules[key];
  if (!module || section.length > 2) notFound();

  return (
    <AdminSectionGuard>
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader title={module.title} description={module.description} />
        {section[1] && (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 font-mono text-xs text-muted-foreground">
            Record reference: {section[1]}
          </div>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-brand-500" />
              <h2 className="font-semibold">Connected records</h2>
            </div>
            <ul className="mt-5 space-y-3">
              {module.records.map((record) => (
                <li
                  key={record}
                  className="flex gap-3 text-sm text-muted-foreground"
                >
                  <CircleDot className="mt-1 h-3 w-3 shrink-0 text-brand-500" />
                  {record}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-brand-500" />
              <h2 className="font-semibold">Controlled workflow</h2>
            </div>
            <ol className="mt-5 space-y-3">
              {module.workflow.map((step, index) => (
                <li key={step} className="flex items-center gap-3 text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </div>
        <section className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
          <h2 className="font-semibold">
            No records match the current organization context
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Records appear here after they are created through the connected
            workflow. Access remains limited by role and organization
            membership.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/admin">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Link href="/admin/audit">
              <Button
                variant="brand"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Review audit trail
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </AdminSectionGuard>
  );
}
