'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
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
} from 'recharts';
import {
  FolderKanban,
  FileCheck,
  Users,
  FileText,
  Receipt,
  Shield,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  ClipboardList,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Target,
  BarChart3,
  Building2,
  Cpu,
  ShoppingBag,
  Truck,
  Lock,
} from 'lucide-react';
import { motion } from 'motion/react';
import { MetricCard } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useAnalyticsDashboard } from '@/lib/api/hooks/use-analytics';
import { useQuotations } from '@/lib/api/hooks/use-quotations';
import { useReportsOverview } from '@/lib/api/hooks/use-reports';
import { useProjects } from '@/lib/api/hooks/use-projects';
import { useActivityLogs } from '@/lib/api/hooks/use-activity-logs';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';
import type { QuotationSummary } from '@/lib/api/models';

const CHART_COLORS = [
  '#14b8a6', // teal-500
  '#0d9488', // teal-600
  '#f59e0b', // amber-500
  '#b87333', // copper
  '#6366f1', // indigo-500
  '#ef4444', // red-500
  '#22c55e', // green-500
  '#8b5cf6', // violet-500
];

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  fontSize: 12,
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(8px)',
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function AdminExecutiveDashboard() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';

  const { data: analytics } = useAnalyticsDashboard(orgId);
  const { data: quotationsData } = useQuotations(orgId, { limit: 6 });
  const { data: reports } = useReportsOverview({ range: 'month', months: 12 });
  const { data: projectsData } = useProjects(orgId, { limit: 200 });
  const { data: auditLogs } = useActivityLogs({ page: 1, limit: 5 });

  const quotations = (quotationsData?.data as QuotationSummary[] | undefined) ?? [];

  // Real revenue trend from the reports overview — the monthly[] array is the
  // trailing 12 months of recorded sales, aggregated across the active branch.
  // Target is unavailable in the DB; render the same series without a target
  // reference line rather than fabricating one.
  const monthlyRevenue = useMemo(() => {
    if (!reports?.monthly?.length) return [];
    return reports.monthly.map((m) => {
      const [year, month] = m.month.split('-').map(Number);
      const label =
        year && month
          ? new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-KE', {
              month: 'short',
              timeZone: 'UTC',
            })
          : m.month;
      return { month: label, revenue: m.revenue };
    });
  }, [reports?.monthly]);

  // Real project distribution by lifecycle status — derived from the live
  // Project rows, not a hard-coded phase table.
  const projects = (projectsData?.data as Array<{ status?: string }> | undefined) ?? [];
  const projectPhases = useMemo(() => {
    if (!projects.length) return [];
    const buckets = new Map<string, number>();
    for (const p of projects) {
      const key = (p.status ?? 'UNKNOWN').replace(/_/g, ' ');
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets.entries())
      .map(([name, count], i) => ({
        name,
        count,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [projects]);

  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) => p.status && !['COMPLETED', 'CANCELLED', 'ON_HOLD'].includes(p.status),
  ).length;

  const auditRows =
    (auditLogs?.data as Array<{
      id: string;
      action: string;
      entity: string;
      actorName?: string | null;
      createdAt: string;
    }> | undefined) ?? [];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-[1600px] mx-auto"
    >
      {/* ── Page Header & Context ── */}
      <PageHeader
        badge="ENTERPRISE EXECUTIVE WORKSPACE"
        title="Executive Overview Dashboard"
        description="Consolidated cross-system visibility across Sales, Project Delivery, Mining Engineering, Finance, and Administration."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/admin/reports">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-1.5 text-brand-600 dark:text-brand-400" />
                Executive Reports
              </Button>
            </Link>
            <Link href="/admin/projects">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                New Project
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── Executive Hero KPIs ── */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricCard
          title="Quotations Pipeline"
          value={
            analytics
              ? formatCurrency(analytics.quotations.totalValue ?? 0, 'USD', true)
              : '—'
          }
          description={
            analytics
              ? `${analytics.quotations.total} quotations`
              : 'no data'
          }
          icon={<TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
        <MetricCard
          title="Active Projects"
          value={totalProjects ? String(activeProjects) : '—'}
          description={
            totalProjects
              ? `${totalProjects} total (${activeProjects} in delivery)`
              : 'no projects yet'
          }
          icon={<FolderKanban className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
        <MetricCard
          title="Total Invoiced (finance)"
          value={
            analytics
              ? formatCurrency(analytics.finance.totalInvoiced ?? 0, 'USD', true)
              : '—'
          }
          description={
            analytics
              ? `${formatCurrency(analytics.finance.totalOutstanding ?? 0, 'USD', true)} outstanding`
              : 'no data'
          }
          icon={<DollarSign className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
        <MetricCard
          title="HSE Incidents"
          value={
            analytics ? String(analytics.hse.openIncidents ?? 0) : '—'
          }
          description={
            analytics
              ? analytics.hse.openIncidents === 0
                ? 'zero open · well done'
                : 'open incidents across sites'
              : 'no data'
          }
          icon={<Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
      </motion.div>

      {/* ── Departmental Navigation Shortcuts ── */}
      <motion.div
        variants={fadeUp}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Link
          href="/admin/leads"
          className="flex items-center gap-3.5 p-4 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">Commercial &amp; Sales</div>
            <div className="text-xs text-muted-foreground">Leads, quotes, RFQs &amp; POS</div>
          </div>
        </Link>

        <Link
          href="/admin/projects"
          className="flex items-center gap-3.5 p-4 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">Project Delivery</div>
            <div className="text-xs text-muted-foreground">Construction, WBS &amp; site logs</div>
          </div>
        </Link>

        <Link
          href="/admin/engineering"
          className="flex items-center gap-3.5 p-4 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">Mining &amp; Engineering</div>
            <div className="text-xs text-muted-foreground">P&amp;IDs, kinetics &amp; commissioning</div>
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="flex items-center gap-3.5 p-4 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">System Administration</div>
            <div className="text-xs text-muted-foreground">Roles, audit logs &amp; security</div>
          </div>
        </Link>
      </motion.div>

      {/* ── Main Charts Grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Performance Area Chart */}
        <motion.div
          variants={fadeUp}
          className="lg:col-span-2 rounded-2xl border border-hairline bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Enterprise Revenue Performance</h3>
              <p className="text-xs text-muted-foreground">Consolidated billing &amp; collections vs corporate target</p>
            </div>
          </div>

          <div className="h-[280px]">
            {monthlyRevenue.length === 0 || monthlyRevenue.every((m) => !m.revenue) ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No recorded sales for the trailing 12 months yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="execRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `KES ${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => formatCurrency(val, 'KES')} />
                  <Area type="monotone" dataKey="revenue" name="Recorded revenue" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#execRevGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Project Phases Breakdown */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-hairline bg-card p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-base font-bold text-foreground">Project Lifecycle Stage</h3>
            <p className="text-xs text-muted-foreground">Distribution of active contracts by stage</p>
          </div>

          <div className="space-y-3 my-4">
            {projectPhases.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No project records yet.
              </div>
            ) : (
              projectPhases.map((phase) => {
                const max = Math.max(...projectPhases.map((p) => p.count));
                return (
                  <div key={phase.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground capitalize">
                        {phase.name.toLowerCase()}
                      </span>
                      <span className="font-mono font-bold text-foreground">{phase.count} projects</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
                      <div className="h-full rounded-full" style={{ width: `${max ? (phase.count / max) * 100 : 0}%`, backgroundColor: phase.fill }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-hairline pt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total Managed Portfolio</span>
            <span className="font-mono font-bold text-foreground">
              {totalProjects
                ? `${totalProjects} project${totalProjects === 1 ? '' : 's'}`
                : '—'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Recent Quotations & Operational Activity ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-hairline bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Commercial Quotations</h3>
              <p className="text-xs text-muted-foreground">Recent tender submissions and B2B quote packages</p>
            </div>
            <Link href="/admin/quotations" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-hairline">
            {quotations.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No quotations found.
              </div>
            ) : (
              quotations.slice(0, 5).map((q) => (
                <div key={q.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">{q.quoteNumber}</span>
                      <StatusBadge status={q.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">{q.client?.companyName ?? 'Mining Prospect'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs font-bold text-foreground">
                      {formatCurrency(q.totalAmount, q.currency ?? 'USD')}
                    </div>
                    <div className="text-[0.6875rem] text-muted-foreground">
                      {formatRelativeDate(q.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Cross-System Audit & Security Feed */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-hairline bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">System Audit Activity</h3>
              <p className="text-xs text-muted-foreground">Real-time governance, logins, and status transitions</p>
            </div>
            <Link href="/admin/audit" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
              Audit Logs <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {auditRows.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No recent audit events.
              </div>
            ) : (
              auditRows.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-hairline bg-surface-elevated"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                    <span className="text-xs font-medium text-foreground truncate">
                      <span className="capitalize">{evt.action.replace(/_/g, ' ').toLowerCase()}</span>
                      {' on '}
                      <span className="text-muted-foreground">{evt.entity}</span>
                      {evt.actorName ? (
                        <>
                          {' · '}
                          <span className="text-muted-foreground">{evt.actorName}</span>
                        </>
                      ) : null}
                    </span>
                  </div>
                  <span className="ml-3 text-[0.6875rem] font-mono text-muted-foreground shrink-0">
                    {formatRelativeDate(evt.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
