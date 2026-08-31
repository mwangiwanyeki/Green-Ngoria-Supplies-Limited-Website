'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  FolderKanban,
  FileCheck,
  Users,
  FileText,
  Receipt,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { MetricCard } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { MetricsSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/page-header';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useAnalyticsDashboard } from '@/lib/api/hooks/use-analytics';
import { useQuotations } from '@/lib/api/hooks/use-quotations';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';
import type { QuotationSummary } from '@/lib/api/models';

const CHART_COLORS = [
  '#1a7a2a',
  '#3db53d',
  '#c8a84b',
  '#b87333',
  '#4a5568',
  '#e53e3e',
];

export function AdminDashboard() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';

  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = useAnalyticsDashboard(orgId);
  const { data: quotationsResp } = useQuotations(orgId, {
    limit: 6,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const recentQuotations: QuotationSummary[] = quotationsResp?.data ?? [];

  if (isError)
    return (
      <ErrorState
        retry={() => void refetch()}
        description="Failed to load dashboard. Is the API running?"
      />
    );

  const dash = analytics;

  // Build chart data from analytics
  const projectChartData = dash?.projects?.byStatus
    ? Object.entries(dash.projects.byStatus)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
    : [];

  const leadChartData = dash?.leads?.byStatus
    ? Object.entries(dash.leads.byStatus)
        .filter(([k, v]) => !['INACTIVE'].includes(k) && v > 0)
        .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
    : [];

  const totalProjects = projectChartData.reduce((s, d) => s + d.value, 0);
  const totalLeads = Object.values(dash?.leads?.byStatus ?? {}).reduce(
    (s: number, v) => s + v,
    0,
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Operations Dashboard"
        description="Green Ngoria enterprise platform — live data from all 9 business systems"
      />

      {/* KPIs */}
      {isLoading ? (
        <MetricsSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            title="Total Projects"
            value={totalProjects}
            icon={<FolderKanban className="h-5 w-5" />}
          />
          <MetricCard
            title="Active Leads"
            value={totalLeads}
            icon={<Users className="h-5 w-5" />}
          />
          <MetricCard
            title="Open RFQs"
            value={dash?.rfqs?.active ?? 0}
            icon={<FileText className="h-5 w-5" />}
          />
          <MetricCard
            title="Quotation Value"
            value={formatCurrency(
              dash?.quotations?.totalValue ?? 0,
              'USD',
              true,
            )}
            description={`${dash?.quotations?.total ?? 0} total`}
            icon={<FileCheck className="h-5 w-5" />}
          />
          <MetricCard
            title="Outstanding"
            value={formatCurrency(
              dash?.finance?.totalOutstanding ?? 0,
              'USD',
              true,
            )}
            description="Invoices due"
            icon={<Receipt className="h-5 w-5" />}
          />
          <MetricCard
            title="Open Incidents"
            value={dash?.hse?.openIncidents ?? 0}
            description={`${dash?.support?.openTickets ?? 0} support tickets`}
            icon={<Shield className="h-5 w-5" />}
          />
        </div>
      )}

      {/* Finance strip */}
      {!isLoading && dash && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: 'Total Invoiced',
              value: dash.finance.totalInvoiced,
              color: 'text-foreground',
            },
            {
              label: 'Total Collected',
              value: dash.finance.totalPaid,
              color: 'text-success',
            },
            {
              label: 'Outstanding',
              value: dash.finance.totalOutstanding,
              color: 'text-warning',
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-5 flex items-center justify-between"
            >
              <div>
                <p className="tech-label mb-1">{label}</p>
                <p className={`text-xl font-bold font-display ${color}`}>
                  {formatCurrency(value, 'USD')}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Projects by lifecycle stage */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold mb-1">Projects by Lifecycle Stage</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {totalProjects} total projects
          </p>
          {isLoading ? (
            <div className="h-[220px] animate-pulse bg-muted rounded-lg" />
          ) : projectChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={projectChartData}
                margin={{ top: 0, right: 0, left: -20, bottom: 40 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              No project data yet
            </div>
          )}
        </div>

        {/* CRM pipeline */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold mb-1">CRM Pipeline</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {totalLeads} leads in pipeline
          </p>
          {isLoading ? (
            <div className="h-[220px] animate-pulse bg-muted rounded-lg" />
          ) : leadChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={leadChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                >
                  {leadChartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              No lead data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent quotations */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Recent Quotations</h2>
          <a
            href="/admin/quotations"
            className="text-sm text-primary hover:underline"
          >
            View all
          </a>
        </div>
        {recentQuotations.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No quotations yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  {[
                    'Quote #',
                    'Title',
                    'Client',
                    'Value',
                    'Status',
                    'Created',
                  ].map((h) => (
                    <th
                      key={h}
                      className="h-10 px-4 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentQuotations.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {q.quoteNumber}
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[180px] truncate">
                      {q.title}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {q.client?.companyName ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-600 dark:text-brand-400 whitespace-nowrap">
                      {formatCurrency(q.totalAmount, q.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatRelativeDate(q.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
