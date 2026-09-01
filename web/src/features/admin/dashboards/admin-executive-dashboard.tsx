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

  const quotations = (quotationsData?.data as QuotationSummary[] | undefined) ?? [];

  const monthlyRevenue = useMemo(() => {
    return [
      { month: 'Jan', revenue: 420000, target: 400000 },
      { month: 'Feb', revenue: 490000, target: 430000 },
      { month: 'Mar', revenue: 560000, target: 460000 },
      { month: 'Apr', revenue: 540000, target: 480000 },
      { month: 'May', revenue: 680000, target: 520000 },
      { month: 'Jun', revenue: 760000, target: 550000 },
      { month: 'Jul', revenue: 840000, target: 600000 },
      { month: 'Aug', revenue: 910000, target: 650000 },
    ];
  }, []);

  const projectPhases = useMemo(() => {
    return [
      { name: 'Planning & Feasibility', count: 4, fill: '#6366f1' },
      { name: 'Engineering & Design', count: 6, fill: '#0d9488' },
      { name: 'Plant Construction', count: 8, fill: '#f59e0b' },
      { name: 'Testing & Commissioning', count: 3, fill: '#22c55e' },
      { name: 'Handover & Support', count: 5, fill: '#14b8a6' },
    ];
  }, []);

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
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/reports">
                <BarChart3 className="h-4 w-4 mr-1.5 text-brand-600 dark:text-brand-400" />
                Executive Reports
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin/projects">
                <Plus className="h-4 w-4 mr-1.5" />
                New Project
              </Link>
            </Button>
          </div>
        }
      />

      {/* ── Executive Hero KPIs ── */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricCard
          title="Total Contracted Pipeline"
          value={formatCurrency(14250000, 'USD', true)}
          delta="+18.2%"
          deltaPositive={true}
          description="YoY growth"
          icon={<TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
        <MetricCard
          title="Active Mining Plants"
          value="8"
          delta="+2"
          deltaPositive={true}
          description="under construction"
          icon={<FolderKanban className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
        <MetricCard
          title="YTD Total Revenue"
          value={formatCurrency(5200000, 'USD', true)}
          delta="+12.4%"
          deltaPositive={true}
          description="ahead of plan"
          icon={<DollarSign className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
        <MetricCard
          title="HSE Safe Days"
          value="412 Days"
          delta="0 LTI"
          deltaPositive={true}
          description="zero LTI across sites"
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
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => formatCurrency(val, 'USD')} />
                <Area type="monotone" dataKey="revenue" name="Total Invoiced" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#execRevGrad)" />
                <Area type="monotone" dataKey="target" name="Target" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
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
            {projectPhases.map((phase) => (
              <div key={phase.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{phase.name}</span>
                  <span className="font-mono font-bold text-foreground">{phase.count} projects</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
                  <div className="h-full rounded-full" style={{ width: `${(phase.count / 10) * 100}%`, backgroundColor: phase.fill }} />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-hairline pt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total Managed Portfolio</span>
            <span className="font-mono font-bold text-foreground">26 Plants &amp; Contracts</span>
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
            {[
              { text: 'Quotation QT-2026-0087 approved by Director', time: '14 min ago', color: 'text-emerald-500' },
              { text: 'Plant Assessment ASM-019 submitted for Bondo Concession', time: '32 min ago', color: 'text-teal-500' },
              { text: 'Daily Site Log filed for Siaya Leaching Project shift', time: '1 hr ago', color: 'text-amber-500' },
              { text: 'Material Purchase Order PO-2026-041 issued to vendor', time: '2 hrs ago', color: 'text-indigo-500' },
              { text: 'System backup and snapshot verified on Supabase Postgres', time: '4 hrs ago', color: 'text-emerald-500' },
            ].map((evt, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-hairline bg-surface-elevated">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  <span className="text-xs font-medium text-foreground">{evt.text}</span>
                </div>
                <span className="text-[0.6875rem] font-mono text-muted-foreground">{evt.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
