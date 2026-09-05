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
  DollarSign,
  TrendingUp,
  FileCheck,
  Users,
  ShoppingBag,
  Calculator,
  ArrowRight,
  Plus,
  Target,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { MetricCard } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { useQuotations } from '@/lib/api/hooks/use-quotations';
import { useLeads } from '@/lib/api/hooks/use-leads';
import { useAnalyticsDashboard } from '@/lib/api/hooks/use-analytics';
import { useReportsOverview } from '@/lib/api/hooks/use-reports';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';
import type { QuotationSummary, LeadSummary } from '@/lib/api/models';

const CHART_COLORS = [
  '#0d9488', // teal-600
  '#14b8a6', // teal-500
  '#f59e0b', // amber-500
  '#b87333', // copper
  '#6366f1', // indigo-500
  '#22c55e', // green-500
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

export function AdminSalesDashboard() {
  const { data: user } = useMe();
  const cachedOrgId = useAuthStore((s) => s.user?.organizationId);
  const orgId = user?.organizationId || cachedOrgId || '';

  const { data: quotationsData } = useQuotations(orgId, { limit: 25 });
  const { data: leadsData } = useLeads<LeadSummary>(orgId, { limit: 25 });
  const { data: analytics } = useAnalyticsDashboard(orgId);
  const { data: reports } = useReportsOverview({ range: 'month', months: 8 });
  const { data: today } = useReportsOverview({ range: 'today' });

  const quotations =
    (quotationsData?.data as QuotationSummary[] | undefined) ?? [];
  const leads = (leadsData?.data as LeadSummary[] | undefined) ?? [];

  // Real monthly sales trend from the branch report; no target column exists
  // in the DB so we render actuals only rather than fabricating one.
  const monthlySalesTrend = useMemo(() => {
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
      return { month: label, actual: m.revenue };
    });
  }, [reports?.monthly]);

  // Real sales funnel derived from lead statuses.
  const pipelineFunnel = useMemo(() => {
    const stageOrder: Array<[string, string[]]> = [
      ['Prospect Leads', ['NEW']],
      ['Consultation Held', ['CONTACTED', 'QUALIFIED']],
      ['Plant Assessment', ['ASSESSMENT']],
      ['RFQ Issued', ['RFQ', 'PROPOSAL']],
      ['Quotation Sent', ['QUOTATION', 'NEGOTIATION']],
      ['Closed / Won', ['WON', 'CLOSED']],
    ];
    return stageOrder.map(([label, matchers]) => {
      const bucket = leads.filter(
        (l) =>
          l.status &&
          matchers.some((m) => (l.status ?? '').toUpperCase().includes(m)),
      );
      const value = bucket.reduce(
        (sum, l) =>
          sum +
          (Number((l as { estimatedValue?: number }).estimatedValue) || 0),
        0,
      );
      return { stage: label, count: bucket.length, value };
    });
  }, [leads]);
  const funnelMaxCount = Math.max(1, ...pipelineFunnel.map((s) => s.count));

  // Real revenue-by-currency breakdown from quotations — the DB has quotation
  // currency but no product-division taxonomy, so this stays neutral instead
  // of inventing "CIP/CIL / Spares / Gemstones" categories.
  const divisionRevenue = useMemo(() => {
    if (!quotations.length) return [];
    const map = new Map<string, number>();
    for (const q of quotations) {
      const key = (q.currency ?? 'USD').toUpperCase();
      map.set(key, (map.get(key) ?? 0) + Number(q.totalAmount ?? 0));
    }
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return Array.from(map.entries()).map(([name, raw]) => ({
      name: `${name} quotations`,
      value: Math.round((raw / total) * 100),
      raw,
    }));
  }, [quotations]);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-[1600px] mx-auto"
    >
      {/* ── Page Header & Context ── */}
      <PageHeader
        badge="SALES & COMMERCIAL WORKSPACE"
        title="Sales & Revenue Command Center"
        description="Real-time commercial pipeline, client acquisition, quotation conversions, and store sales operations."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/admin/pos">
              <Button variant="outline" size="sm">
                <Calculator className="h-4 w-4 mr-1.5 text-brand-600 dark:text-brand-400" />
                Open POS Register
              </Button>
            </Link>
            <Link href="/admin/quotations">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                New Quotation
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── Sales Hero KPIs ── */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricCard
          title="Active Pipeline Value"
          value={
            analytics
              ? formatCurrency(
                  analytics.quotations.totalValue ?? 0,
                  'USD',
                  true,
                )
              : '—'
          }
          description={
            analytics
              ? `${analytics.quotations.total} active quotations`
              : 'no data'
          }
          icon={
            <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          }
        />
        <MetricCard
          title="Today's Sales (ERP + POS)"
          value={
            today ? formatCurrency(Number(today.totalRevenue ?? 0), 'KES') : '—'
          }
          description={
            today
              ? `${today.ordersCount ?? 0} transaction${today.ordersCount === 1 ? '' : 's'}`
              : 'no branch data'
          }
          icon={
            <ShoppingBag className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          }
        />
        <MetricCard
          title="Quotations · won"
          value={
            quotations.length
              ? String(
                  quotations.filter(
                    (q) =>
                      (q.status ?? '').toUpperCase().includes('WON') ||
                      (q.status ?? '').toUpperCase() === 'APPROVED',
                  ).length,
                )
              : '—'
          }
          description={
            quotations.length
              ? `${quotations.length} total tracked`
              : 'no quotations yet'
          }
          icon={
            <FileCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          }
        />
        <MetricCard
          title="Active Client Leads"
          value={leads.length ? String(leads.length) : '—'}
          description={
            leads.length
              ? `${leads.filter((l) => (l.status ?? '').toUpperCase() === 'NEW').length} new · ${leads.filter((l) => ['WON', 'CLOSED', 'LOST'].includes((l.status ?? '').toUpperCase())).length} closed`
              : 'no leads yet'
          }
          icon={<Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
      </motion.div>

      {/* ── Quick Action Shortcuts ── */}
      <motion.div
        variants={fadeUp}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        <Link
          href="/admin/leads"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              New Client Lead
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Capture inquiry / operator
            </div>
          </div>
        </Link>

        <Link
          href="/admin/quotations"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              Draft Quotation
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              B2B Mining quote / plant
            </div>
          </div>
        </Link>

        <Link
          href="/admin/pos"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              POS Terminal
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Counter sales &amp; receipt
            </div>
          </div>
        </Link>

        <Link
          href="/admin/rfqs"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              Client RFQs
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Process incoming RFQ
            </div>
          </div>
        </Link>

        <Link
          href="/admin/customers"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              Customer Accounts
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Balances &amp; credit terms
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ── Main Charts Grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Trajectory vs Targets */}
        <motion.div
          variants={fadeUp}
          className="lg:col-span-2 rounded-2xl border border-hairline bg-card p-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Revenue Trajectory vs Target
              </h3>
              <p className="text-xs text-muted-foreground">
                Monthly closed sales vs target pacing
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500" /> Closed
                Revenue
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-border" /> Target
              </span>
            </div>
          </div>

          <div className="h-[280px]">
            {monthlySalesTrend.length === 0 ||
            monthlySalesTrend.every((m) => !m.actual) ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No recorded sales in the trailing months.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlySalesTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#0d9488"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 11,
                      fill: 'hsl(var(--muted-foreground))',
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: 'hsl(var(--muted-foreground))',
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `KES ${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: number) => formatCurrency(val, 'KES')}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    name="Closed Revenue"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Division Breakdown */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-hairline bg-card p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-base font-bold text-foreground">
              Revenue by Division
            </h3>
            <p className="text-xs text-muted-foreground">
              Commercial distribution by sector
            </p>
          </div>

          <div className="h-[200px] my-2">
            {divisionRevenue.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No quotation revenue tracked yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={divisionRevenue}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {divisionRevenue.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: number) => `${val}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-2 border-t border-hairline pt-3">
            {divisionRevenue.length === 0 ? (
              <div className="py-2 text-center text-xs text-muted-foreground">
                —
              </div>
            ) : (
              divisionRevenue.map((d, i) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                    {d.name}
                  </span>
                  <span className="font-semibold text-foreground">
                    {d.value}%
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Commercial Pipeline Funnel & Quotations ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Stages */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-hairline bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Sales Funnel Velocity
              </h3>
              <p className="text-xs text-muted-foreground">
                Conversion stages from lead to won deal
              </p>
            </div>
            <Link
              href="/admin/leads"
              className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              View CRM <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3 mt-4">
            {leads.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No leads recorded yet.
              </div>
            ) : (
              pipelineFunnel.map((stage, idx) => {
                const pct = Math.round((stage.count / funnelMaxCount) * 100);
                return (
                  <div key={stage.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">
                        {stage.stage}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-muted-foreground">
                          {stage.count} deal{stage.count === 1 ? '' : 's'}
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {stage.value
                            ? formatCurrency(stage.value, 'USD', true)
                            : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
                      <div
                        className="h-full rounded-full bg-teal-600 transition-all duration-500"
                        style={{ width: `${pct}%`, opacity: 0.4 + idx * 0.12 }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Quotations Awaiting Client Action */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-hairline bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">
                High-Value Quotations
              </h3>
              <p className="text-xs text-muted-foreground">
                Pending customer reviews &amp; approvals
              </p>
            </div>
            <Link
              href="/admin/quotations"
              className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              All Quotes <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-hairline">
            {quotations.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No quotations currently pending.
              </div>
            ) : (
              quotations.slice(0, 5).map((q) => (
                <div
                  key={q.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {q.quoteNumber}
                      </span>
                      <StatusBadge status={q.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {q.client?.companyName ?? 'Internal Prospect'}
                    </div>
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
      </div>
    </motion.div>
  );
}
