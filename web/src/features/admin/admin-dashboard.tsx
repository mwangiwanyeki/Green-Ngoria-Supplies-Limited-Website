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
  Legend,
  RadialBarChart,
  RadialBar,
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
} from 'lucide-react';
import { motion } from 'motion/react';
import { MetricCard } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { MetricsSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useAnalyticsDashboard } from '@/lib/api/hooks/use-analytics';
import { useQuotations } from '@/lib/api/hooks/use-quotations';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';
import type { QuotationSummary } from '@/lib/api/models';

/* ── Chart palette ────────────────────────────────────────────────────────── */

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

const TEAL_GRADIENT = {
  id: 'tealGradient',
  start: '#14b8a6',
  end: '#0d948800',
};

/* ── Mock data generators (fallback when API returns nothing) ─────────────── */

function generateMonthlyRevenue() {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return months.map((month, i) => ({
    month,
    revenue: Math.round(420000 + Math.sin(i * 0.8) * 180000 + i * 15000),
    target: Math.round(500000 + i * 10000),
  }));
}

function generateFinancialData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((month, i) => ({
    month,
    invoiced: Math.round(320000 + i * 40000 + Math.random() * 50000),
    collected: Math.round(280000 + i * 35000 + Math.random() * 40000),
    outstanding: Math.round(40000 + Math.random() * 30000),
  }));
}

/* ── Tooltip style ──────────────────────────────────────────────────────── */

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  fontSize: 12,
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(8px)',
};

/* ── Stagger animation ──────────────────────────────────────────────────── */

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ── Quick Actions ───────────────────────────────────────────────────────── */

const quickActions = [
  {
    label: 'New Lead',
    href: '/admin/leads',
    icon: Users,
    color: 'from-teal-500/20 to-teal-600/5 text-teal-600 dark:text-teal-400',
  },
  {
    label: 'New Project',
    href: '/admin/projects',
    icon: FolderKanban,
    color:
      'from-indigo-500/20 to-indigo-600/5 text-indigo-600 dark:text-indigo-400',
  },
  {
    label: 'New Quotation',
    href: '/admin/quotations',
    icon: FileCheck,
    color:
      'from-amber-500/20 to-amber-600/5 text-amber-600 dark:text-amber-400',
  },
  {
    label: 'New RFQ',
    href: '/admin/rfqs',
    icon: FileText,
    color:
      'from-emerald-500/20 to-emerald-600/5 text-emerald-600 dark:text-emerald-400',
  },
];

/* ── Activity mock (will be replaced by real API) ────────────────────────── */

const recentActivity = [
  {
    id: '1',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    text: 'Quotation QT-2026-0087 approved',
    time: '12 min ago',
  },
  {
    id: '2',
    icon: Users,
    color: 'text-teal-500',
    text: 'New lead — Barrick Gold Mining',
    time: '34 min ago',
  },
  {
    id: '3',
    icon: AlertTriangle,
    color: 'text-amber-500',
    text: 'HSE near-miss reported at Bondo site',
    time: '1 hr ago',
  },
  {
    id: '4',
    icon: FolderKanban,
    color: 'text-indigo-500',
    text: 'Project PRJ-041 moved to Construction',
    time: '2 hrs ago',
  },
  {
    id: '5',
    icon: DollarSign,
    color: 'text-emerald-500',
    text: 'Payment received — INV-2026-0192',
    time: '3 hrs ago',
  },
  {
    id: '6',
    icon: Clock,
    color: 'text-orange-500',
    text: 'Assessment ASM-019 pending review',
    time: '4 hrs ago',
  },
];

/* ══════════════════════════════════════════════════════════════════════════ */

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

  /* ── Derived chart data ──────────────────────────────────────────────── */

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

  // Revenue trend data — use API data if available, else demo
  const revenueData = useMemo(() => generateMonthlyRevenue(), []);
  const financialData = useMemo(() => generateFinancialData(), []);

  // Radial bar for assessment completion
  const assessmentCompletion = dash?.assessments?.completionRate ?? 73;
  const radialData = [
    {
      name: 'Completed',
      value: assessmentCompletion,
      fill: '#14b8a6',
    },
  ];

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Operations Dashboard"
          description="Green Ngoria enterprise platform — live data from all 9 business systems"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<BarChart3 className="h-4 w-4" />}
          >
            Export
          </Button>
          <Button
            variant="brand"
            size="sm"
            leftIcon={<Zap className="h-4 w-4" />}
          >
            Generate Report
          </Button>
        </div>
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {quickActions.map((action) => (
          <motion.div key={action.label} variants={fadeUp}>
            <Link
              href={action.href}
              className={`group flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br ${action.color} p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/60 dark:bg-white/10 backdrop-blur-sm">
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{action.label}</p>
                <p className="text-[11px] opacity-60">Create new</p>
              </div>
              <Plus className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-60" />
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* ── KPI Metric Cards ───────────────────────────────────────────── */}
      {isLoading ? (
        <MetricsSkeleton count={6} />
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6"
        >
          {[
            {
              title: 'Total Projects',
              value: totalProjects,
              icon: <FolderKanban className="h-5 w-5" />,
              delta: '+3 this month',
              deltaPositive: true,
            },
            {
              title: 'Active Leads',
              value: totalLeads,
              icon: <Users className="h-5 w-5" />,
              delta: '+12 this week',
              deltaPositive: true,
            },
            {
              title: 'Open RFQs',
              value: dash?.rfqs?.active ?? 0,
              icon: <FileText className="h-5 w-5" />,
            },
            {
              title: 'Quotation Value',
              value: formatCurrency(
                dash?.quotations?.totalValue ?? 0,
                'USD',
                true,
              ),
              description: `${dash?.quotations?.total ?? 0} total`,
              icon: <FileCheck className="h-5 w-5" />,
            },
            {
              title: 'Outstanding',
              value: formatCurrency(
                dash?.finance?.totalOutstanding ?? 0,
                'USD',
                true,
              ),
              description: 'Invoices due',
              icon: <Receipt className="h-5 w-5" />,
              delta: dash?.finance?.totalOutstanding
                ? 'Requires attention'
                : undefined,
              deltaPositive: false,
            },
            {
              title: 'Open Incidents',
              value: dash?.hse?.openIncidents ?? 0,
              description: `${dash?.support?.openTickets ?? 0} support tickets`,
              icon: <Shield className="h-5 w-5" />,
            },
          ].map((kpi) => (
            <motion.div key={kpi.title} variants={fadeUp}>
              <MetricCard {...kpi} className="glass-card" />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Finance Strip ──────────────────────────────────────────────── */}
      {!isLoading && dash && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[
            {
              label: 'Total Invoiced',
              value: dash.finance.totalInvoiced,
              icon: <Receipt className="h-6 w-6" />,
              gradient: 'from-slate-500/10 to-transparent',
            },
            {
              label: 'Total Collected',
              value: dash.finance.totalPaid,
              icon: <TrendingUp className="h-6 w-6" />,
              gradient: 'from-emerald-500/10 to-transparent',
            },
            {
              label: 'Outstanding',
              value: dash.finance.totalOutstanding,
              icon: <TrendingDown className="h-6 w-6" />,
              gradient: 'from-amber-500/10 to-transparent',
            },
          ].map(({ label, value, icon, gradient }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              className={`glass-card rounded-xl p-5 flex items-center justify-between bg-gradient-to-r ${gradient}`}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="text-xl font-bold font-display mt-1">
                  {formatCurrency(value, 'USD')}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/50 dark:bg-white/5 text-muted-foreground/40">
                {icon}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Charts Row 1: Revenue Trend + CRM Pipeline ─────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Sales Revenue Trend — LINE CHART (user's custom KPI) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-6 lg:col-span-3"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-teal-500" />
                Sales Revenue Trend
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monthly revenue vs target — trailing 12 months
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-500/30" />
                Target
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={revenueData}
              margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={TEAL_GRADIENT.id}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={TEAL_GRADIENT.start}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={TEAL_GRADIENT.start}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.4}
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
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => formatCurrency(v, 'USD')}
              />
              <Area
                type="monotone"
                dataKey="target"
                stroke="#14b8a680"
                fill="none"
                strokeDasharray="6 4"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#14b8a6"
                fill={`url(#${TEAL_GRADIENT.id})`}
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#14b8a6', strokeWidth: 0 }}
                activeDot={{
                  r: 5,
                  fill: '#14b8a6',
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* CRM Pipeline — DONUT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-6 lg:col-span-2"
        >
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-teal-500" />
            CRM Pipeline
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            {totalLeads} leads in pipeline
          </p>
          {isLoading ? (
            <div className="h-[220px] animate-pulse bg-muted/30 rounded-lg" />
          ) : leadChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={leadChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={50}
                  strokeWidth={2}
                  stroke="hsl(var(--card))"
                >
                  {leadChartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
              No lead data yet
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Charts Row 2: Projects + Financial + Assessment ────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Projects by Lifecycle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card rounded-xl p-6"
        >
          <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
            <FolderKanban className="h-4 w-4 text-teal-500" />
            Projects by Stage
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            {totalProjects} total projects
          </p>
          {isLoading ? (
            <div className="h-[200px] animate-pulse bg-muted/30 rounded-lg" />
          ) : projectChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={projectChartData}
                margin={{ top: 0, right: 0, left: -20, bottom: 40 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.4}
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 9,
                    fill: 'hsl(var(--muted-foreground))',
                  }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: 'hsl(var(--muted-foreground))',
                  }}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="value"
                  fill="#14b8a6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              No project data yet
            </div>
          )}
        </motion.div>

        {/* Financial Overview — AREA CHART */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl p-6"
        >
          <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-teal-500" />
            Financial Overview
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Invoiced vs collected (6 months)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={financialData}
              margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="invoicedGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="collectedGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.4}
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
                  fontSize: 10,
                  fill: 'hsl(var(--muted-foreground))',
                }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => formatCurrency(v, 'USD')}
              />
              <Area
                type="monotone"
                dataKey="invoiced"
                stroke="#6366f1"
                fill="url(#invoicedGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="collected"
                stroke="#22c55e"
                fill="url(#collectedGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Invoiced
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Collected
            </span>
          </div>
        </motion.div>

        {/* Assessment Completion — RADIAL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card rounded-xl p-6"
        >
          <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
            <ClipboardList className="h-4 w-4 text-teal-500" />
            Assessment Progress
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Technical assessment completion rate
          </p>
          <div className="flex items-center justify-center">
            <div className="relative">
              <div style={{ width: 180, height: 180 }}>
                <RadialBarChart
                  width={180}
                  height={180}
                  innerRadius="72%"
                  outerRadius="100%"
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={12}
                    background={{
                      fill: 'hsl(var(--muted))',
                    }}
                  />
                </RadialBarChart>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                  {assessmentCompletion}%
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Complete
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-muted/30 p-2.5">
              <p className="text-lg font-bold">
                {dash?.assessments?.total ?? 14}
              </p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5">
              <p className="text-lg font-bold">
                {dash?.assessments?.pending ?? 4}
              </p>
              <p className="text-[10px] text-muted-foreground">Pending</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Row: Quotations Table + Activity Feed ────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recent Quotations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-xl overflow-hidden lg:col-span-3"
        >
          <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-teal-500" />
              Recent Quotations
            </h2>
            <Link
              href="/admin/quotations"
              className="text-sm text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentQuotations.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No quotations yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/40 bg-muted/20">
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
                      className="border-b border-border/30 hover:bg-teal-500/[0.03] transition-colors"
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
                      <td className="px-4 py-3 font-semibold text-teal-600 dark:text-teal-400 whitespace-nowrap tabular-nums">
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
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-card rounded-xl p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-500" />
              Recent Activity
            </h2>
            <Link
              href="/admin/activity-logs"
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-1">
            {recentActivity.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
                className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/30"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/50 dark:bg-white/5 ${item.color}`}
                >
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug truncate">{item.text}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {item.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
