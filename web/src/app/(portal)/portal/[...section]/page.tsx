import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { PortalNotificationsList } from '@/features/portal/portal-notifications-list';
import { PortalAssessmentsList } from '@/features/portal/portal-assessments-list';
import { PortalRfqsList } from '@/features/portal/portal-rfqs-list';
import { PortalDocumentsList } from '@/features/portal/portal-documents-list';
import { PortalInvoicesList } from '@/features/portal/portal-invoices-list';
import { PortalAssetsList } from '@/features/portal/portal-assets-list';

const portalModules: Record<
  string,
  { title: string; description: string; items: string[] }
> = {
  projects: {
    title: 'Projects',
    description:
      'Track authorized project scope, progress, milestones, documents and decisions requiring your attention.',
    items: [
      'Project status and progress',
      'Milestones and approvals',
      'Controlled documents',
      'Commissioning and handover',
    ],
  },
  quotations: {
    title: 'Quotations',
    description:
      'Review commercial proposals issued to your organization and their current approval state.',
    items: [
      'Quotation scope',
      'Line items and totals',
      'Revision history',
      'Acceptance status',
    ],
  },
  assessments: {
    title: 'Technical Assessments',
    description:
      'Track submitted plant and site assessments, clarifications, reviewed findings and next steps.',
    items: [
      'Assessment reference and status',
      'Submitted plant information',
      'Secure attachments',
      'Engineering review and follow-up',
    ],
  },
  rfqs: {
    title: 'Requests for Quotation',
    description:
      'Prepare and track equipment, spares and project RFQs with technical attachments.',
    items: [
      'Draft and submitted RFQs',
      'Line items and quantities',
      'Technical documents',
      'Quotation conversion status',
    ],
  },
  documents: {
    title: 'Project Documents',
    description:
      'Access only the controlled project documents released to your organization.',
    items: [
      'Drawings and specifications',
      'Reports and datasheets',
      'Revision and approval state',
      'Controlled signed downloads',
    ],
  },
  invoices: {
    title: 'Invoices & Payments',
    description:
      'Review authorized invoices, due dates, balances and recorded payments.',
    items: [
      'Invoice and contract reference',
      'Line items and totals',
      'Due date and payment status',
      'Receipts and balances',
    ],
  },
  assets: {
    title: 'Plant Assets',
    description:
      'View handed-over equipment, warranty context and maintenance history for authorized projects.',
    items: [
      'Asset and serial identity',
      'Project and installation location',
      'Warranty period',
      'Service and work-order history',
    ],
  },
};

export default async function PortalModulePage({
  params,
}: {
  params: Promise<{ section: string[] }>;
}) {
  const { section } = await params;
  const key = section[0];
  const reference = section[1];

  if (key === 'notifications') {
    return <PortalNotificationsList />;
  }

  if (!reference) {
    if (key === 'assessments') return <PortalAssessmentsList />;
    if (key === 'rfqs') return <PortalRfqsList />;
    if (key === 'documents') return <PortalDocumentsList />;
    if (key === 'invoices') return <PortalInvoicesList />;
    if (key === 'assets') return <PortalAssetsList />;
  }

  const module = portalModules[key];
  if (!module) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title={reference ? `${module.title} record` : module.title}
        description={module.description}
      />
      {reference && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 font-mono text-xs text-muted-foreground">
          Record reference: {reference}
        </div>
      )}
      <section className="grid gap-4 sm:grid-cols-2">
        {module.items.map((item) => (
          <div
            key={item}
            className="flex gap-3 rounded-xl border border-border bg-card p-5"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
            <span className="text-sm font-medium">{item}</span>
          </div>
        ))}
      </section>
      <section className="rounded-xl border border-dashed border-border p-10 text-center">
        <LockKeyhole className="mx-auto h-8 w-8 text-brand-500" />
        <h2 className="mt-4 font-semibold">
          No authorized record is available
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Only records explicitly associated with your organization and account
          are displayed. Contact the project team if you expected to see an item
          here.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/portal">
            <Button variant="outline">Dashboard</Button>
          </Link>
          <Link href="/portal/support">
            <Button
              variant="brand"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Contact support
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
