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
  LineChart,
  Line,
} from 'recharts';
import {
  Cpu,
  ClipboardList,
  Files,
  MapPin,
  FlaskConical,
  FileCheck,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Activity,
  Mountain,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { MetricCard } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { useAssessments } from '@/lib/api/hooks/use-assessments';
import { useAnalyticsDashboard } from '@/lib/api/hooks/use-analytics';
import { useDocuments } from '@/lib/api/hooks/use-engineering';
import { formatRelativeDate } from '@/lib/utils';

const CHART_COLORS = [
  '#0d9488', // teal-600
  '#f59e0b', // amber-500
  '#b87333', // copper
  '#6366f1', // indigo-500
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

export function AdminEngineeringDashboard() {
  const { data: user } = useMe();
  const cachedOrgId = useAuthStore((s) => s.user?.organizationId);
  const orgId = user?.organizationId || cachedOrgId || '';

  type AssessmentRow = {
    id: string;
    reference?: string;
    status?: string;
    clientName?: string;
    miningLocation?: string | null;
    mineralType?: string | null;
    estimatedTph?: number | null;
    createdAt: string;
  };
  const { data: assessmentsData } = useAssessments(orgId, { limit: 25 });
  const assessments =
    (assessmentsData?.data as AssessmentRow[] | undefined) ?? [];
  const { data: analytics } = useAnalyticsDashboard(orgId);
  type EngDoc = {
    id: string;
    reference?: string;
    title?: string;
    revision?: string | number;
    status?: string;
  };
  const { data: docsData } = useDocuments<EngDoc>(orgId, { limit: 8 });
  const engineeringDocs = (docsData?.data as EngDoc[] | undefined) ?? [];

  // No kinetics/adsorption time-series exists in the DB — the previous
  // curve was demo. Hide the chart with an empty state until a real
  // metallurgical test-run source lands.
  const leachingKinetics: Array<{
    time: string;
    dissolution: number;
    adsorption: number;
  }> = [];

  // Real intake mix from live assessments' mineralType.
  const mineralIntake = useMemo(() => {
    if (!assessments.length) return [];
    const map = new Map<string, number>();
    for (const a of assessments) {
      const key = (a.mineralType ?? 'OTHER').replace(/_/g, ' ');
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(map.entries())
      .map(([name, count]) => ({
        name,
        value: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.value - a.value);
  }, [assessments]);

  const pendingAssessments = assessments.filter(
    (a) =>
      a.status &&
      !['COMPLETED', 'CANCELLED', 'APPROVED'].includes(
        (a.status ?? '').toUpperCase(),
      ),
  ).length;
  const approvedDocsPct = engineeringDocs.length
    ? Math.round(
        (engineeringDocs.filter(
          (d) => (d.status ?? '').toUpperCase() === 'APPROVED',
        ).length /
          engineeringDocs.length) *
          100,
      )
    : 0;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-[1600px] mx-auto"
    >
      {/* ── Page Header & Context ── */}
      <PageHeader
        badge="METALLURGY & PLANT ENGINEERING"
        title="Engineering & Process Command Center"
        description="Technical plant assessments, ore metallurgy kinetics, P&ID drawing revisions, commissioning test compliance, and asset reliability."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/admin/engineering">
              <Button variant="outline" size="sm">
                <Files className="h-4 w-4 mr-1.5 text-brand-600 dark:text-brand-400" />
                Upload P&amp;ID Drawing
              </Button>
            </Link>
            <Link href="/admin/assessments">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                New Assessment
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── Engineering Hero KPIs ── */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricCard
          title="Plant Assessments in Queue"
          value={assessments.length > 0 ? String(pendingAssessments) : '—'}
          description={
            assessments.length > 0
              ? `${assessments.length} total tracked`
              : 'no assessments yet'
          }
          icon={
            <ClipboardList className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          }
        />
        <MetricCard
          title="Controlled Engineering Docs"
          value={engineeringDocs.length ? String(engineeringDocs.length) : '—'}
          description={
            engineeringDocs.length
              ? `${approvedDocsPct}% approved`
              : 'no documents yet'
          }
          icon={<Files className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
        <MetricCard
          title="Assessment completion rate"
          value={
            analytics?.assessments
              ? `${(analytics.assessments.completionRate ?? 0).toFixed(1)}%`
              : '—'
          }
          description={
            analytics?.assessments
              ? `${analytics.assessments.total ?? 0} logged`
              : 'no data'
          }
          icon={
            <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          }
        />
        <MetricCard
          title="Open HSE incidents"
          value={analytics ? String(analytics.hse.openIncidents ?? 0) : '—'}
          description={
            analytics
              ? analytics.hse.openIncidents === 0
                ? 'zero open · well done'
                : 'requires attention'
              : 'no data'
          }
          icon={<Cpu className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
      </motion.div>

      {/* ── Quick Action Shortcuts ── */}
      <motion.div
        variants={fadeUp}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        <Link
          href="/admin/assessments"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              Plant Assessment
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Ore kinetics &amp; flowsheets
            </div>
          </div>
        </Link>

        <Link
          href="/admin/engineering"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Files className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              Document Control
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              P&amp;IDs, drawings, revisions
            </div>
          </div>
        </Link>

        <Link
          href="/admin/mining-sites"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              Mining Sites
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Concessions &amp; ore bodies
            </div>
          </div>
        </Link>

        <Link
          href="/admin/vat-leach"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              Vat Leach Kinetics
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Reagent dosing &amp; recovery
            </div>
          </div>
        </Link>

        <Link
          href="/admin/assets"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              Plant Asset Register
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Maintenance &amp; work orders
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ── Main Engineering Charts ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* CIP/CIL Kinetics Curve */}
        <motion.div
          variants={fadeUp}
          className="lg:col-span-2 rounded-2xl border border-hairline bg-card p-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-foreground">
                CIP/CIL Leaching &amp; Adsorption Kinetics
              </h3>
              <p className="text-xs text-muted-foreground">
                Gold dissolution rate vs activated carbon adsorption % across
                24hr residence time
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />{' '}
                Dissolution %
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />{' '}
                Carbon Adsorption %
              </span>
            </div>
          </div>

          <div className="h-[280px]">
            {leachingKinetics.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-xs text-muted-foreground">
                <span>No metallurgical test-run data captured yet.</span>
                <span className="mt-1 text-[10px] opacity-70">
                  Once lab kinetics runs are recorded, the dissolution &amp;
                  adsorption curves will render here.
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={leachingKinetics}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="time"
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
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: number) => `${val}%`}
                  />
                  <Line
                    type="monotone"
                    dataKey="dissolution"
                    name="Au Dissolution"
                    stroke="#0d9488"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="adsorption"
                    name="Carbon Adsorption"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Ore Deposit Distribution */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-hairline bg-card p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-base font-bold text-foreground">
              Ore Intake by Metallurgy
            </h3>
            <p className="text-xs text-muted-foreground">
              Technical plant assessments by deposit type
            </p>
          </div>

          <div className="h-[200px] my-2">
            {mineralIntake.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No assessments logged yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mineralIntake}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {mineralIntake.map((entry, index) => (
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
            {mineralIntake.length === 0 ? (
              <div className="py-2 text-center text-xs text-muted-foreground">
                —
              </div>
            ) : (
              mineralIntake.map((d, i) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="flex items-center gap-2 text-muted-foreground truncate max-w-[180px]">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                    <span className="truncate">{d.name}</span>
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

      {/* ── Technical Assessments & Document Control Feed ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plant Assessments Queue */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-hairline bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Technical Plant Assessments
              </h3>
              <p className="text-xs text-muted-foreground">
                Awaiting engineering calculation &amp; flowsheet review
              </p>
            </div>
            <Link
              href="/admin/assessments"
              className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              All Assessments <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-hairline">
            {assessments.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No plant assessments currently in queue.
              </div>
            ) : (
              assessments.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {a.reference}
                      </span>
                      <StatusBadge status={a.status ?? 'PENDING'} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.clientName} • {a.miningLocation ?? 'East Africa'} •{' '}
                      {a.mineralType ?? 'GOLD'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs font-bold text-foreground">
                      {a.estimatedTph
                        ? `${a.estimatedTph} TPH`
                        : '30 TPH Target'}
                    </div>
                    <div className="text-[0.6875rem] text-muted-foreground">
                      {formatRelativeDate(a.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Controlled P&ID Documents */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-hairline bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Controlled Engineering Documents
              </h3>
              <p className="text-xs text-muted-foreground">
                P&amp;IDs, process flow diagrams, and mechanical transmittals
              </p>
            </div>
            <Link
              href="/admin/engineering"
              className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              Doc Control <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {engineeringDocs.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No engineering documents uploaded yet.
              </div>
            ) : (
              engineeringDocs.slice(0, 4).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-hairline bg-surface-elevated"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                        {doc.reference ?? doc.id.slice(0, 8)}
                      </span>
                      {doc.revision != null && (
                        <span className="text-[0.6875rem] rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
                          Rev {String(doc.revision)}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs font-medium text-foreground">
                      {doc.title ?? '—'}
                    </div>
                  </div>
                  <div className="ml-3 shrink-0">
                    <StatusBadge status={doc.status ?? 'DRAFT'} />
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
