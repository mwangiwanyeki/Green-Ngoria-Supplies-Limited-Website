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
import { useProjects } from '@/lib/api/hooks/use-projects';
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
  const orgId = user?.organizationId ?? '';

  const { data: projectsData, isLoading } = useProjects(orgId, { limit: 10 });
  const projects = (projectsData?.data as ProjectSummary[] | undefined) ?? [];

  // Project Progress across key sites
  const siteProgressData = useMemo(() => {
    return [
      { site: 'Bondo CIP (30 TPH)', engineering: 100, construction: 82, commissioning: 45 },
      { site: 'Siaya Leaching Exp.', engineering: 100, construction: 95, commissioning: 70 },
      { site: 'Taita Taveta Plant', engineering: 85, construction: 40, commissioning: 10 },
      { site: 'Migori CIL Upgrade', engineering: 60, construction: 15, commissioning: 0 },
    ];
  }, []);

  // Workforce and Site hours weekly trend
  const workforceTrend = useMemo(() => {
    return [
      { day: 'Mon', workers: 142, hours: 1120 },
      { day: 'Tue', workers: 148, hours: 1180 },
      { day: 'Wed', workers: 152, hours: 1210 },
      { day: 'Thu', workers: 146, hours: 1160 },
      { day: 'Fri', workers: 150, hours: 1200 },
      { day: 'Sat', workers: 98, hours: 780 },
    ];
  }, []);

  // Upcoming Milestones
  const upcomingMilestones = useMemo(() => {
    return [
      {
        id: '1',
        title: 'Elution Column Hydro-Testing',
        project: 'Bondo CIP Expansion',
        date: 'In 2 days',
        status: 'ON_TRACK',
      },
      {
        id: '2',
        title: 'Primary Ball Mill Alignment Inspection',
        project: 'Siaya Leaching Expansion',
        date: 'In 4 days',
        status: 'ON_TRACK',
      },
      {
        id: '3',
        title: 'Tailings Slurry Pipework Erection',
        project: 'Taita Taveta Mining Plant',
        date: 'In 6 days',
        status: 'IN_PROGRESS',
      },
      {
        id: '4',
        title: 'Substation Transformer Energisation',
        project: 'Migori CIL Upgrade',
        date: 'In 9 days',
        status: 'PENDING_REVIEW',
      },
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
        badge="PROJECT DELIVERY & SITE OPS"
        title="Project Manager Command Center"
        description="Active mining plant delivery, construction phases, daily site logs, workforce tracking, and commissioning schedules."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/site-ops">
                <Hammer className="h-4 w-4 mr-1.5 text-brand-600 dark:text-brand-400" />
                Submit Site Report
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

      {/* ── PM Hero KPIs ── */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricCard
          title="Active Plant Projects"
          value={projects.length > 0 ? String(projects.length) : '8'}
          delta="+2"
          deltaPositive={true}
          description="new awards"
          icon={<FolderKanban className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
        <MetricCard
          title="Milestone Schedule Health"
          value="94.2%"
          delta="+3.1%"
          deltaPositive={true}
          description="on schedule"
          icon={<CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
        <MetricCard
          title="Active On-Site Workforce"
          value="152"
          delta="+14"
          deltaPositive={true}
          description="technicians on shift"
          icon={<Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
        />
        <MetricCard
          title="Open Punch List Items"
          value="14"
          delta="-6"
          deltaPositive={true}
          description="closed this week"
          icon={<Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
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
            <div className="text-xs font-semibold text-foreground">Project Register</div>
            <div className="text-[0.6875rem] text-muted-foreground">Phases, WBS &amp; deliverables</div>
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
            <div className="text-xs font-semibold text-foreground">Daily Site Logs</div>
            <div className="text-[0.6875rem] text-muted-foreground">Progress &amp; shift reports</div>
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
            <div className="text-xs font-semibold text-foreground">Commissioning</div>
            <div className="text-[0.6875rem] text-muted-foreground">Cold &amp; hot test sign-offs</div>
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
            <div className="text-xs font-semibold text-foreground">Procurement Reqs</div>
            <div className="text-[0.6875rem] text-muted-foreground">Equipment &amp; materials PO</div>
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
            <div className="text-xs font-semibold text-foreground">HSE Safety Logs</div>
            <div className="text-[0.6875rem] text-muted-foreground">Toolbox talks &amp; incidents</div>
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
              <h3 className="text-base font-bold text-foreground">Active Plant Construction &amp; Delivery</h3>
              <p className="text-xs text-muted-foreground">Progress completion across Engineering, Construction, and Commissioning</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-600" /> Engineering
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Construction
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Commissioning
              </span>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={siteProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="site" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => `${val}%`} />
                <Bar dataKey="engineering" name="Engineering" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="construction" name="Construction" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="commissioning" name="Commissioning" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Weekly Workforce & Hours */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-hairline bg-card p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-base font-bold text-foreground">Site Workforce Pacing</h3>
            <p className="text-xs text-muted-foreground">Daily deployed technicians &amp; safe man-hours</p>
          </div>

          <div className="h-[210px] my-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={workforceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="workers" name="Technicians" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-hairline pt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total Safe Man-Hours (Week)</span>
            <span className="font-mono font-bold text-foreground">6,650 hrs (0 LTI)</span>
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
              <h3 className="text-base font-bold text-foreground">Mining Projects Under Execution</h3>
              <p className="text-xs text-muted-foreground">Scope, client operator, and current delivery state</p>
            </div>
            <Link href="/admin/projects" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
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
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">{p.projectNumber}</span>
                      <span className="text-xs font-semibold text-foreground">{p.name}</span>
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
              <h3 className="text-base font-bold text-foreground">Critical Path Milestones</h3>
              <p className="text-xs text-muted-foreground">Inspection, hydro-testing, and energisation gates</p>
            </div>
            <Link href="/admin/site-ops" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
              Site Logs <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingMilestones.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-hairline bg-surface-elevated">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">{m.title}</div>
                  <div className="text-[0.6875rem] text-muted-foreground">{m.project}</div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-medium text-amber-600 dark:text-amber-400">{m.date}</span>
                  <StatusBadge status={m.status} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
