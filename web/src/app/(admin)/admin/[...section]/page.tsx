import type React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CircleDot, Database, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { AdminEquipmentList } from '@/features/admin/admin-equipment-list';
import { AdminFinanceList } from '@/features/admin/admin-finance-list';
import { AdminHseList } from '@/features/admin/admin-hse-list';
import { AdminProcurementList } from '@/features/admin/admin-procurement-list';
import { AdminNotificationsList } from '@/features/admin/admin-notifications-list';
import { AdminAssessmentsList } from '@/features/admin/admin-assessments-list';
import { AdminDashboard } from '@/features/admin/admin-dashboard';
import { AdminAssetsList } from '@/features/admin/admin-assets-list';
import { AdminClientsList } from '@/features/admin/admin-clients-list';
import { AdminCommissioningList } from '@/features/admin/admin-commissioning-list';
import { AdminContractsList } from '@/features/admin/admin-contracts-list';
import { AdminEngineeringList } from '@/features/admin/admin-engineering-list';
import { AdminInventory } from '@/features/admin/erp/admin-inventory';
import { AdminPos } from '@/features/admin/erp/admin-pos';
import { AdminSales } from '@/features/admin/erp/admin-sales';
import { AdminStoreManagement } from '@/features/admin/erp/admin-store-management';
import { AdminCustomers } from '@/features/admin/erp/admin-customers';
import { AdminDebt } from '@/features/admin/erp/admin-debt';
import { AdminExpenses } from '@/features/admin/erp/admin-expenses';
import { AdminAccounts } from '@/features/admin/erp/admin-accounts';
import { AdminSuppliers } from '@/features/admin/erp/admin-suppliers';
import { AdminVatLeach } from '@/features/admin/erp/admin-vat-leach';
import { AdminStockPiles } from '@/features/admin/erp/admin-stock-piles';
import { AdminSecurity } from '@/features/admin/erp/admin-security';
import {
  AdminHrOverview,
  AdminHrStaff,
  AdminHrPayroll,
  AdminHrLeave,
} from '@/features/admin/erp/admin-hr';
import { AdminVisitors } from '@/features/admin/erp/admin-visitors';
import { AdminReports } from '@/features/admin/erp/admin-reports';
import { AdminActivityLogs } from '@/features/admin/erp/admin-activity-logs';
import { AdminSettings } from '@/features/admin/erp/admin-settings';
import { AdminProfile } from '@/features/admin/admin-profile';

function AdminInvoicesModule() {
  return <AdminFinanceList initialTab="invoices" />;
}

function AdminPaymentsModule() {
  return <AdminFinanceList initialTab="payments" />;
}

// Modules with a real, data-wired list/dashboard component. Rendered in
// place of the generic placeholder scaffold below.
const wiredModules: Record<string, React.ComponentType> = {
  // Engineering-services modules
  analytics: AdminDashboard,
  assets: AdminAssetsList,
  clients: AdminClientsList,
  commissioning: AdminCommissioningList,
  contracts: AdminContractsList,
  engineering: AdminEngineeringList,
  equipment: AdminEquipmentList,
  invoices: AdminInvoicesModule,
  payments: AdminPaymentsModule,
  hse: AdminHseList,
  procurement: AdminProcurementList,
  notifications: AdminNotificationsList,
  assessments: AdminAssessmentsList,
  // Operations ERP modules
  inventory: AdminInventory,
  pos: AdminPos,
  'today-sales': AdminSales,
  'all-sales': AdminSales,
  'store-management': AdminStoreManagement,
  customers: AdminCustomers,
  'manage-debt': AdminDebt,
  expenses: AdminExpenses,
  accounts: AdminAccounts,
  suppliers: AdminSuppliers,
  'vat-leach': AdminVatLeach,
  'stock-piles': AdminStockPiles,
  security: AdminSecurity,
  'hr/overview': AdminHrOverview,
  'hr/staff': AdminHrStaff,
  'hr/payroll': AdminHrPayroll,
  'hr/leave': AdminHrLeave,
  visitors: AdminVisitors,
  reports: AdminReports,
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
  if (WiredModule) return <WiredModule />;

  // Fall back to the static record scaffold for engineering placeholders.
  const module = modules[key];
  if (!module || section.length > 2) notFound();

  return (
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
          workflow. Access remains limited by role and organization membership.
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
  );
}
