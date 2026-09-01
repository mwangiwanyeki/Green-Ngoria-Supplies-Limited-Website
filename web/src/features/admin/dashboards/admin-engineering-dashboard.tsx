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
import { useAssessments } from '@/lib/api/hooks/use-assessments';
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
  const orgId = user?.organizationId ?? '';

  const { data: assessmentsData, isLoading } = useAssessments(orgId, { limit: 10 });
  const assessments = (assessmentsData?.data as any[] | undefined) ?? [];

  // CIP/CIL Gold Recovery Kinetics curve
  const leachingKinetics = useMemo(() => {
    return [
      { time: '0h', dissolution: 0, adsorption: 0 },
      { time: '4h', dissolution: 45, adsorption: 28 },
      { time: '8h', dissolution: 72, adsorption: 58 },
      { time: '12h', dissolution: 86, adsorption: 76 },
      { time: '16h', dissolution: 92, adsorption: 88 },
      { time: '20h', dissolution: 95, adsorption: 93 },
      { time: '24h', dissolution: 96.8, adsorption: 95.4 },
    ];
  }, []);

  // Ore deposit distribution in technical intake
  const mineralIntake = useMemo(() => {
    return [
      { name: 'Gold (Hard-Rock / Quartz)', value: 62 },
      { name: 'Alluvial Gold & Placers', value: 20 },
      { name: 'Gemstones (Tanzanite/Tsavorite)', value: 12 },
      { name: 'Base Metals & Copper', value: 6 },
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
        badge="METALLURGY & PLANT ENGINEERING"
        title="Engineering & Process Command Center"
        description="Technical plant assessments, ore metallurgy kinetics, P&ID drawing revisions, commissioning test compliance, and asset reliability."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/engineering">
                <Files className="h-4 w-4 mr-1.5 text-brand-600 dark:text-brand-400" />
                Upload P&amp;ID Drawing
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin/assessments">
                <Plus className="h-4 w-4 mr-1.5" />
                New Assessment
              </Link>
            </Button>
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
          value={assessments.length > 0 ? String(assessments.length) : '9'}
          delta="+3"
          deltaPositive={true}
          description="awaiting calculation"
          icon={<ClipboardList className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
        <MetricCard
          title="Controlled P&IDs / Circuits"
          value="34"
          delta="+5"
          deltaPositive={true}
          description="revised this month"
          icon={<Files className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
        <MetricCard
          title="Commissioning Test Pass Rate"
          value="96.5%"
          delta="+1.8%"
          deltaPositive={true}
          description="first-pass sign-off"
          icon={<CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
        <MetricCard
          title="Plant Asset Uptime Rate"
          value="98.4%"
          delta="+0.4%"
          deltaPositive={true}
          description="MTBF compliant"
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
            <div className="text-xs font-semibold text-foreground">Plant Assessment</div>
            <div className="text-[0.6875rem] text-muted-foreground">Ore kinetics &amp; flowsheets</div>
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
            <div className="text-xs font-semibold text-foreground">Document Control</div>
            <div className="text-[0.6875rem] text-muted-foreground">P&amp;IDs, drawings, revisions</div>
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
            <div className="text-xs font-semibold text-foreground">Mining Sites</div>
            <div className="text-[0.6875rem] text-muted-foreground">Concessions &amp; ore bodies</div>
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
            <div className="text-xs font-semibold text-foreground">Vat Leach Kinetics</div>
            <div className="text-[0.6875rem] text-muted-foreground">Reagent dosing &amp; recovery</div>
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
            <div className="text-xs font-semibold text-foreground">Plant Asset Register</div>
            <div className="text-[0.6875rem] text-muted-foreground">Maintenance &amp; work orders</div>
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
              <h3 className="text-base font-bold text-foreground">CIP/CIL Leaching &amp; Adsorption Kinetics</h3>
              <p className="text-xs text-muted-foreground">Gold dissolution rate vs activated carbon adsorption % across 24hr residence time</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-600" /> Dissolution %
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Carbon Adsorption %
              </span>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leachingKinetics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => `${val}%`} />
                <Line type="monotone" dataKey="dissolution" name="Au Dissolution" stroke="#0d9488" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="adsorption" name="Carbon Adsorption" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Ore Deposit Distribution */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-hairline bg-card p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-base font-bold text-foreground">Ore Intake by Metallurgy</h3>
            <p className="text-xs text-muted-foreground">Technical plant assessments by deposit type</p>
          </div>

          <div className="h-[200px] my-2">
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
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => `${val}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-hairline pt-3">
            {mineralIntake.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground truncate max-w-[180px]">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="truncate">{d.name}</span>
                </span>
                <span className="font-semibold text-foreground">{d.value}%</span>
              </div>
            ))}
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
              <h3 className="text-base font-bold text-foreground">Technical Plant Assessments</h3>
              <p className="text-xs text-muted-foreground">Awaiting engineering calculation &amp; flowsheet review</p>
            </div>
            <Link href="/admin/assessments" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
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
                <div key={a.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">{a.reference}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.clientName} • {a.miningLocation ?? 'East Africa'} • {a.mineralType ?? 'GOLD'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs font-bold text-foreground">
                      {a.estimatedTph ? `${a.estimatedTph} TPH` : '30 TPH Target'}
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
              <h3 className="text-base font-bold text-foreground">Controlled Engineering Documents</h3>
              <p className="text-xs text-muted-foreground">P&amp;IDs, process flow diagrams, and mechanical transmittals</p>
            </div>
            <Link href="/admin/engineering" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
              Doc Control <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { code: 'PFD-2026-001', title: 'Bondo Gold CIL 45 TPH Process Flow Diagram', rev: 'Rev C', status: 'APPROVED' },
              { code: 'PID-2026-014', title: 'Cyanide Leaching Tank Agitator P&ID', rev: 'Rev B', status: 'UNDER_REVIEW' },
              { code: 'LAY-2026-008', title: 'Primary Jaw Crusher & Secondary Cone Layout', rev: 'Rev A', status: 'APPROVED' },
              { code: 'DTS-2026-033', title: 'Carbon Regeneration Kiln Technical Datasheet', rev: 'Rev D', status: 'APPROVED' },
            ].map((doc) => (
              <div key={doc.code} className="flex items-center justify-between p-3 rounded-xl border border-hairline bg-surface-elevated">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">{doc.code}</span>
                    <span className="text-[0.6875rem] rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">{doc.rev}</span>
                  </div>
                  <div className="text-xs font-medium text-foreground">{doc.title}</div>
                </div>
                <div>
                  <StatusBadge status={doc.status} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
