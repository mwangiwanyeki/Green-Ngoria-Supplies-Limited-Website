'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Hammer,
  Truck,
  FileCheck,
  Plus,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  Activity,
  Boxes,
} from 'lucide-react';
import { motion } from 'motion/react';
import { MetricCard } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { useProjects } from '@/lib/api/hooks/use-projects';
import { useAnalyticsDashboard } from '@/lib/api/hooks/use-analytics';
import { useHrOverview } from '@/lib/api/hooks/use-hr';
import { formatRelativeDate } from '@/lib/utils';
import type { ProjectSummary } from '@/lib/api/models';

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

export function AdminPmDashboard() {
  const { data: user } = useMe();
  const cachedOrgId = useAuthStore((s) => s.user?.organizationId);
  const orgId = user?.organizationId || cachedOrgId || '';

  const { data: projectsData } = useProjects(orgId, { limit: 25 });
  const { data: analytics } = useAnalyticsDashboard(orgId);
  const { data: hr } = useHrOverview();
  const projects = (projectsData?.data as ProjectSummary[] | undefined) ?? [];

  // Real per-project progress. The Project model doesn't carry per-phase
  // percentages, so we show the top 4 active projects with any progress
  // field present (falling back to 0). No fabricated phase splits.
  const siteProgressData = useMemo(() => {
    if (!projects.length) return [];
    return projects
      .filter((p) => p.status && !['COMPLETED', 'CANCELLED'].includes(p.status))
      .slice(0, 4)
      .map((p) => ({
        site:
          p.name?.length && p.name.length > 22
            ? `${p.name.slice(0, 22)}…`
            : (p.name ?? '—'),
        progress: Number((p as { progress?: number }).progress ?? 0),
      }));
  }, [projects]);

  // Real critical path — the earliest 4 upcoming project targetEndDate rows.
  type ProjectWithEnd = ProjectSummary & {
    targetEndDate?: string | null;
    expectedCompletionDate?: string | null;
  };
  const upcomingMilestones = useMemo(() => {
    const now = Date.now();
    return (projects as ProjectWithEnd[])
      .map((p) => {
        const end = p.targetEndDate ?? p.expectedCompletionDate;
        return end ? { project: p, endMs: new Date(end).getTime(), end } : null;
      })
      .filter(
        (row): row is { project: ProjectWithEnd; endMs: number; end: string } =>
          !!row && row.endMs >= now,
      )
      .sort((a, b) => a.endMs - b.endMs)
      .slice(0, 4)
      .map((row) => ({
        id: row.project.id,
        title: row.project.name ?? '—',
        project: row.project.client?.companyName ?? 'Internal project',
        date: formatRelativeDate(row.end),
        status: row.project.status ?? 'IN_PROGRESS',
      }));
  }, [projects]);

  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) =>
      p.status && !['COMPLETED', 'CANCELLED', 'ON_HOLD'].includes(p.status),
  ).length;
  const onTrackPct = activeProjects
    ? Math.round(
        (projects.filter((p) =>
          ['ACTIVE', 'IN_PROGRESS', 'ON_TRACK'].includes(
            (p.status ?? '').toUpperCase(),
          ),
        ).length /
          activeProjects) *
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
        badge="PROJECT DELIVERY & SITE OPS"
        title="Project Manager Command Center"
        description="Active mining plant delivery, construction phases, daily site logs, workforce tracking, and commissioning schedules."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/admin/site-ops">
              <Button variant="outline" size="sm">
                <Hammer className="h-4 w-4 mr-1.5 text-brand-600 dark:text-brand-400" />
                Submit Site Report
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

      {/* ── PM Hero KPIs ── */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricCard
          title="Active Plant Projects"
          value={totalProjects ? String(activeProjects) : '—'}
          description={
            totalProjects ? `${totalProjects} total tracked` : 'no projects yet'
          }
          icon={
            <FolderKanban className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          }
        />
        <MetricCard
          title="Projects on schedule"
          value={activeProjects ? `${onTrackPct}%` : '—'}
          description={
            activeProjects
              ? `${activeProjects} in delivery`
              : 'no delivery data'
          }
          icon={
            <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          }
        />
        <MetricCard
          title="Active On-Site Workforce"
          value={
            hr
              ? String(
                  hr.checkedInToday ??
                    hr.byStatus?.ACTIVE ??
                    hr.totalStaff ??
                    0,
                )
              : '—'
          }
          description={hr ? `${hr.totalStaff ?? 0} on headcount` : 'no HR data'}
          icon={<Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
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
          icon={
            <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          }
        />
      </motion.div>

      {/* ── Quick Action Shortcuts ── */}
      <motion.div
        variants={fadeUp}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        <Link
          href="/admin/projects"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              Project Register
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Phases, WBS &amp; deliverables
            </div>
          </div>
        </Link>

        <Link
          href="/admin/site-ops"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Hammer className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              Daily Site Logs
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Progress &amp; shift reports
            </div>
          </div>
        </Link>

        <Link
          href="/admin/commissioning"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              Commissioning
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Cold &amp; hot test sign-offs
            </div>
          </div>
        </Link>

        <Link
          href="/admin/procurement"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              Procurement Reqs
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Equipment &amp; materials PO
            </div>
          </div>
        </Link>

        <Link
          href="/admin/hse"
          className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-card shadow-sm hover:border-brand-500/40 hover:bg-surface-elevated transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              HSE Safety Logs
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Toolbox talks &amp; incidents
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ── Main Delivery Charts ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project Phase Completion % */}
        <motion.div
          variants={fadeUp}
          className="lg:col-span-2 rounded-2xl border border-hairline bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Active Plant Delivery Progress
              </h3>
              <p className="text-xs text-muted-foreground">
                Reported completion per active project
              </p>
            </div>
          </div>

          <div className="h-[280px]">
            {siteProgressData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No active projects with progress data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={siteProgressData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="site"
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
                  <Bar
                    dataKey="progress"
                    name="Completion"
                    fill="#0d9488"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Weekly Workforce & Hours */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-hairline bg-card p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-base font-bold text-foreground">
              Workforce Snapshot
            </h3>
            <p className="text-xs text-muted-foreground">
              Live HR headcount from the active branch
            </p>
          </div>

          <div className="flex flex-1 items-center justify-center py-6">
            {!hr ? (
              <div className="text-xs text-muted-foreground">Loading…</div>
            ) : hr.totalStaff === 0 ? (
              <div className="text-center text-xs text-muted-foreground">
                No staff records yet.
                <br />
                Add staff under HR › Manage Staff.
              </div>
            ) : (
              <div className="grid w-full grid-cols-2 gap-3 text-center">
                <StatBlock label="Total staff" value={hr.totalStaff} />
                <StatBlock label="Active" value={hr.byStatus?.ACTIVE ?? 0} />
                <StatBlock label="On leave" value={hr.onLeaveNow ?? 0} />
                <StatBlock
                  label="Checked-in today"
                  value={hr.checkedInToday ?? 0}
                />
              </div>
            )}
          </div>

          <div className="border-t border-hairline pt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">HSE open incidents</span>
            <span className="font-mono font-bold text-foreground">
              {analytics ? String(analytics.hse.openIncidents ?? 0) : '—'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Active Projects & Milestone Schedule ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Projects Register */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-hairline bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Mining Projects Under Execution
              </h3>
              <p className="text-xs text-muted-foreground">
                Scope, client operator, and current delivery state
              </p>
            </div>
            <Link
              href="/admin/projects"
              className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              All Projects <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-hairline">
            {projects.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No active projects found.
              </div>
            ) : (
              projects.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {p.projectNumber}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {p.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{p.client?.companyName ?? 'Internal Project'}</span>
                      <span>•</span>
                      <span>Type: {p.type ?? 'CIP_GOLD_PLANT'}</span>
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={p.status ?? 'ACTIVE'} />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Critical Milestones */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-hairline bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Critical Path Milestones
              </h3>
              <p className="text-xs text-muted-foreground">
                Inspection, hydro-testing, and energisation gates
              </p>
            </div>
            <Link
              href="/admin/site-ops"
              className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              Site Logs <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingMilestones.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No upcoming project deadlines.
              </div>
            ) : (
              upcomingMilestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-hairline bg-surface-elevated"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="truncate text-xs font-semibold text-foreground">
                      {m.title}
                    </div>
                    <div className="text-[0.6875rem] text-muted-foreground">
                      {m.project}
                    </div>
                  </div>
                  <div className="ml-3 flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-mono font-medium text-amber-600 dark:text-amber-400">
                      {m.date}
                    </span>
                    <StatusBadge status={m.status} />
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

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-elevated py-3">
      <div className="font-mono text-2xl font-bold text-foreground">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
