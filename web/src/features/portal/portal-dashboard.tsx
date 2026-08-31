'use client';

import Link from 'next/link';
import {
  FolderKanban,
  FileCheck,
  Receipt,
  LifeBuoy,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { MetricCard } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useProjects } from '@/lib/api/hooks/use-projects';
import { useQuotations } from '@/lib/api/hooks/use-quotations';
import { formatDate, formatCurrency, formatRelativeDate } from '@/lib/utils';
import { MetricsSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import type { ProjectSummary, QuotationSummary } from '@/lib/api/models';

export function PortalDashboard() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';

  const { data: projectsResp, isLoading: projectsLoading } = useProjects(orgId);
  const { data: quotationsResp, isLoading: quotationsLoading } = useQuotations(
    orgId,
    { limit: 5 },
  );

  const projects: ProjectSummary[] = projectsResp?.data ?? [];
  const quotations: QuotationSummary[] = quotationsResp?.data ?? [];
  const projectMeta = projectsResp?.meta;

  const activeProjects = projects.filter(
    (p) => !['COMPLETED', 'CANCELLED'].includes(p.status),
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title="My Dashboard"
        description="Overview of your projects, documents and commercial activity"
      />

      {/* KPIs */}
      {projectsLoading ? (
        <MetricsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            title="Active Projects"
            value={activeProjects.length}
            icon={<FolderKanban className="h-5 w-5" />}
          />
          <MetricCard
            title="Total Projects"
            value={projectMeta?.total ?? projects.length}
            icon={<FolderKanban className="h-5 w-5" />}
          />
          <MetricCard
            title="Quotations"
            value={quotations.length}
            icon={<FileCheck className="h-5 w-5" />}
          />
          <MetricCard
            title="Support Tickets"
            value="—"
            icon={<LifeBuoy className="h-5 w-5" />}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Active projects */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-semibold">Active Projects</h2>
            <Link href="/portal/projects">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                View all
              </Button>
            </Link>
          </div>

          {projectsLoading ? (
            <div className="p-6">
              <TableSkeleton rows={3} />
            </div>
          ) : activeProjects.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No active projects
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activeProjects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  href={`/portal/projects/${project.id}`}
                  className="flex items-start justify-between px-6 py-4 hover:bg-accent/30 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.projectNumber}
                    </p>
                    {project.targetEndDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Due {formatDate(project.targetEndDate)}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={project.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent quotations */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-semibold">Recent Quotations</h2>
            <Link href="/portal/quotations">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                View all
              </Button>
            </Link>
          </div>

          {quotationsLoading ? (
            <div className="p-6">
              <TableSkeleton rows={3} />
            </div>
          ) : quotations.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No quotations yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {quotations.map((q) => (
                <Link
                  key={q.id}
                  href={`/portal/quotations/${q.id}`}
                  className="flex items-start justify-between px-6 py-4 hover:bg-accent/30 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium truncate">{q.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.quoteNumber} · {formatRelativeDate(q.createdAt)}
                    </p>
                    <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                      {formatCurrency(q.totalAmount, q.currency)}
                    </p>
                  </div>
                  <StatusBadge status={q.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Request RFQ', href: '/request-rfq', icon: FileCheck },
            {
              label: 'View Documents',
              href: '/portal/documents',
              icon: FolderKanban,
            },
            { label: 'View Invoices', href: '/portal/invoices', icon: Receipt },
            { label: 'Open Support', href: '/portal/support', icon: LifeBuoy },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-sm font-medium hover:bg-accent hover:border-brand-500/30 transition-all text-center"
            >
              <Icon className="h-6 w-6 text-brand-500" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
