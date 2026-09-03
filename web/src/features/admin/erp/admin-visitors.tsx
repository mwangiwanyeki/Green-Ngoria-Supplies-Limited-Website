'use client';

import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  UserCheck,
  Plus,
  Globe,
  Users,
  Timer,
  MousePointerClick,
  Eye,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  Bot,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Textarea } from '@/components/ui/input';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { KpiRow } from '@/components/admin/erp-list-shell';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import {
  useVisitors,
  useVisitorStats,
  useCreateVisitor,
  useCheckOutVisitor,
  type Visitor,
} from '@/lib/api/hooks/use-visitors';
import { useWebAnalytics } from '@/lib/api/hooks/use-web-analytics';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { useBranchStore } from '@/stores/branch-store';
import { formatRelativeDate, cn } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  fontSize: 12,
};

function fmtDuration(ms: number): string {
  if (!ms || ms < 1000) return '0s';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m}m ${rem}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function AdminVisitors() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Visitors Management"
        description="Website traffic analytics and the physical front-desk visitor log."
      />
      <Tabs defaultValue="web">
        <TabsList>
          <TabsTrigger value="web">
            <Globe className="mr-2 h-4 w-4" />
            Website Traffic
          </TabsTrigger>
          <TabsTrigger value="desk">
            <UserCheck className="mr-2 h-4 w-4" />
            Front-desk Log
          </TabsTrigger>
        </TabsList>
        <TabsContent value="web" className="mt-6">
          <WebsiteTraffic />
        </TabsContent>
        <TabsContent value="desk" className="mt-6">
          <FrontDeskLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Website Traffic ───────────────────────────────────────────────────────

const RANGES: Array<[number, string]> = [
  [7, '7 days'],
  [30, '30 days'],
  [90, '90 days'],
];

function WebsiteTraffic() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError, refetch } = useWebAnalytics(days);

  const chart = useMemo(
    () =>
      (data?.timeseries ?? []).map((d) => ({
        date: new Date(d.date).toLocaleDateString('en-KE', {
          month: 'short',
          day: 'numeric',
        }),
        views: d.views,
        visitors: d.sessions,
      })),
    [data?.timeseries],
  );

  if (isLoading) return <PageSkeleton />;
  if (isError)
    return <ErrorState description={getApiErrorMessage(undefined)} retry={() => void refetch()} />;

  const t = data?.totals;
  const hasData = (t?.pageViews ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {RANGES.map(([d, label]) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                days === d
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          Auto-refreshes every minute · first-party, cookieless
        </span>
      </div>

      <KpiRow
        items={[
          {
            label: 'Page Views',
            value: (t?.pageViews ?? 0).toLocaleString(),
            sub: `${t?.todayViews ?? 0} today`,
            icon: <Eye className="h-4 w-4" />,
            accent: 'brand',
          },
          {
            label: 'Unique Visitors',
            value: (t?.sessions ?? 0).toLocaleString(),
            sub: `${t?.todaySessions ?? 0} today`,
            icon: <Users className="h-4 w-4" />,
            accent: 'success',
          },
          {
            label: 'Avg Session',
            value: fmtDuration(t?.avgSessionDurationMs ?? 0),
            icon: <Timer className="h-4 w-4" />,
            accent: 'default',
          },
          {
            label: 'Pages / Session',
            value: String(t?.avgPagesPerSession ?? 0),
            icon: <MousePointerClick className="h-4 w-4" />,
            accent: 'default',
          },
        ]}
      />

      {!hasData ? (
        <EmptyState
          icon={<Globe className="h-6 w-6" />}
          title="No website traffic recorded yet"
          description="Once visitors browse greenngoria.com, their (anonymous) page views, journeys, locations and dwell times appear here."
        />
      ) : (
        <>
          <div className="glass-card rounded-xl border border-hairline bg-card p-6">
            <h3 className="mb-1 text-base font-semibold">Traffic over time</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Page views and unique visitors per day
            </p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vwGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="vsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="views" name="Page views" stroke="#0d9488" strokeWidth={2.5} fill="url(#vwGrad)" />
                  <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#6366f1" strokeWidth={2.5} fill="url(#vsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TopPagesCard pages={data?.topPages ?? []} />
            <BreakdownCard title="Top locations" icon={<MapPin className="h-4 w-4" />} rows={data?.byCountry ?? []} />
            <BreakdownCard title="Devices" icon={<Monitor className="h-4 w-4" />} rows={data?.byDevice ?? []} />
            <BreakdownCard title="Referrers" icon={<Globe className="h-4 w-4" />} rows={data?.byReferrer ?? []} />
          </div>

          <RecentSessionsCard sessions={data?.recentSessions ?? []} />
        </>
      )}
    </div>
  );
}

function TopPagesCard({
  pages,
}: {
  pages: Array<{ path: string; views: number; avgTimeMs: number }>;
}) {
  const max = Math.max(1, ...pages.map((p) => p.views));
  return (
    <div className="rounded-xl border border-hairline bg-card p-6">
      <h3 className="mb-4 text-base font-semibold">Top pages</h3>
      {pages.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pages yet.</p>
      ) : (
        <ul className="space-y-3">
          {pages.map((p) => (
            <li key={p.path} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-mono text-foreground">{p.path}</span>
                <span className="shrink-0 text-muted-foreground">
                  {p.views.toLocaleString()} · {fmtDuration(p.avgTimeMs)} avg
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${(p.views / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BreakdownCard({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  rows: Array<{ name: string; value: number }>;
}) {
  const total = rows.reduce((a, b) => a + b.value, 0) || 1;
  const deviceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n === 'mobile') return <Smartphone className="h-3.5 w-3.5" />;
    if (n === 'tablet') return <Tablet className="h-3.5 w-3.5" />;
    if (n === 'bot') return <Bot className="h-3.5 w-3.5" />;
    if (n === 'desktop') return <Monitor className="h-3.5 w-3.5" />;
    return null;
  };
  return (
    <div className="rounded-xl border border-hairline bg-card p-6">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
        {icon}
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center gap-3 text-xs">
              <span className="flex w-32 shrink-0 items-center gap-1.5 text-foreground">
                {deviceIcon(r.name)}
                <span className="truncate">{r.name}</span>
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                <div className="h-full rounded-full bg-teal-500" style={{ width: `${(r.value / total) * 100}%` }} />
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-muted-foreground">
                {r.value} · {Math.round((r.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecentSessionsCard({
  sessions,
}: {
  sessions: import('@/lib/api/hooks/use-web-analytics').WebAnalyticsOverview['recentSessions'];
}) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="rounded-xl border border-hairline bg-card p-6">
      <h3 className="mb-1 text-base font-semibold">Recent visitor journeys</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Each visitor&apos;s path through the site, most recent first. Click to expand the journey.
      </p>
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sessions yet.</p>
      ) : (
        <ul className="divide-y divide-hairline overflow-hidden rounded-lg border border-hairline">
          {sessions.map((s) => {
            const expanded = open === s.sessionId;
            const loc = [s.city, s.region, s.country].filter(Boolean).join(', ') || 'Unknown location';
            return (
              <li key={s.sessionId}>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : s.sessionId)}
                  className="flex w-full items-center gap-3 bg-card p-3 text-left hover:bg-muted/40"
                >
                  <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <MapPin className="h-3 w-3 text-brand-500" />
                        {loc}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {s.deviceType ?? '—'}{s.browser ? ` · ${s.browser}` : ''}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {s.pageCount} page{s.pageCount === 1 ? '' : 's'} · {fmtDuration(s.durationMs)} · {formatRelativeDate(s.lastAt)}
                      {s.referrer ? ` · from ${safeHost(s.referrer)}` : ''}
                    </div>
                  </div>
                </button>
                {expanded && (
                  <div className="bg-surface-sunken px-4 py-3">
                    <ol className="space-y-1.5">
                      {s.journey.map((path, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/15 font-mono text-[10px] text-brand-600 dark:text-brand-400">
                            {i + 1}
                          </span>
                          <span className="font-mono text-foreground">{path}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

// ── Front-desk Log (physical visitors) ────────────────────────────────────

function FrontDeskLog() {
  const branchId = useBranchStore((s) => s.activeBranchId) ?? '';
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const query = useVisitors({ search: debouncedSearch, page, limit: perPage });
  const { data: stats } = useVisitorStats();

  const [showAdd, setShowAdd] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<Visitor | null>(null);
  const createVisitor = useCreateVisitor();
  const checkOut = useCheckOutVisitor();

  const isCheckedIn = (r: Visitor) =>
    (r.status ?? '').toUpperCase() === 'CHECKED_IN' || r.status === 'checked-in';

  const columns: ErpColumn<Visitor>[] = [
    {
      key: 'name',
      header: 'Visitor',
      cell: (r) => (
        <div>
          <div className="font-medium">{r.fullName}</div>
          {r.idNumber && (
            <div className="font-mono text-xs text-muted-foreground">{r.idNumber}</div>
          )}
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', cell: (r) => r.phone ?? '—' },
    { key: 'company', header: 'Company', cell: (r) => r.company ?? '—' },
    { key: 'host', header: 'Host', cell: (r) => r.hostName ?? r.host ?? '—' },
    { key: 'purpose', header: 'Purpose', cell: (r) => r.purpose ?? '—' },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge variant={isCheckedIn(r) ? 'brand' : 'success'}>
          {isCheckedIn(r) ? 'On-site' : 'Checked out'}
        </Badge>
      ),
    },
    {
      key: 'in',
      header: 'Checked in',
      cell: (r) => (
        <span className="text-xs text-muted-foreground">{formatRelativeDate(r.checkInAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (r) =>
        isCheckedIn(r) ? (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={() => setCheckoutTarget(r)}
            >
              Check out
            </Button>
          </div>
        ) : (
          <span className="block text-right text-xs text-muted-foreground pr-2">—</span>
        ),
    },
  ];

  return (
    <>
      <ErpListPage
        title="Front-desk Visitor Log"
        description="Register and track people physically visiting the active branch."
        actions={
          <Button
            size="sm"
            variant="brand"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAdd(true)}
            disabled={!branchId}
          >
            Register Visitor
          </Button>
        }
        kpis={[
          {
            label: 'Currently on-site',
            value: stats?.checkedInNow ?? 0,
            icon: <UserCheck className="h-4 w-4" />,
            accent: 'brand',
          },
          {
            label: 'Today total',
            value: stats?.todaysVisitors ?? 0,
            icon: <Users className="h-4 w-4" />,
            accent: 'default',
          },
        ]}
        searchPlaceholder="Search name, ID, company…"
        columns={columns}
        query={query}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
        emptyLabel="No visitors yet"
        rowKey={(r) => r.id}
      />

      {showAdd && (
        <RegisterVisitorDialog
          branchId={branchId}
          pending={createVisitor.isPending}
          onClose={() => setShowAdd(false)}
          submit={async (payload) => {
            try {
              await createVisitor.mutateAsync({ ...payload, branchId });
              toast.success('Visitor registered');
              setShowAdd(false);
            } catch (err) {
              toast.error(getApiErrorMessage(err, 'Could not register visitor'));
            }
          }}
        />
      )}

      <ConfirmDialog
        open={!!checkoutTarget}
        onOpenChange={(o) => !o && setCheckoutTarget(null)}
        title={`Check out ${checkoutTarget?.fullName ?? 'visitor'}?`}
        description="This records their departure time and frees their badge."
        confirmLabel="Check out"
        loading={checkOut.isPending}
        onConfirm={() => {
          if (!checkoutTarget) return;
          checkOut.mutate(checkoutTarget.id, {
            onSuccess: () => {
              toast.success('Visitor checked out');
              setCheckoutTarget(null);
            },
            onError: (err) => toast.error(getApiErrorMessage(err, 'Check-out failed')),
          });
        }}
      />
    </>
  );
}

function RegisterVisitorDialog({
  branchId,
  pending,
  onClose,
  submit,
}: {
  branchId: string;
  pending: boolean;
  onClose: () => void;
  submit: (v: {
    fullName: string;
    idNumber?: string;
    phone?: string;
    email?: string;
    company?: string;
    purpose?: string;
    hostName?: string;
    vehiclePlate?: string;
  }) => void;
}) {
  const [f, setF] = useState({
    fullName: '',
    idNumber: '',
    phone: '',
    email: '',
    company: '',
    purpose: '',
    hostName: '',
    vehiclePlate: '',
  });
  const set = <K extends keyof typeof f>(k: K, v: string) => setF((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Register visitor</DialogTitle>
          <DialogDescription>
            {branchId ? 'A badge number is generated automatically.' : 'Select a branch first.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name *"><Input value={f.fullName} onChange={(e) => set('fullName', e.target.value)} /></Field>
          <Field label="ID number"><Input value={f.idNumber} onChange={(e) => set('idNumber', e.target.value)} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Company"><Input value={f.company} onChange={(e) => set('company', e.target.value)} /></Field>
          <Field label="Host (person visited)"><Input value={f.hostName} onChange={(e) => set('hostName', e.target.value)} /></Field>
          <Field label="Vehicle plate"><Input value={f.vehiclePlate} onChange={(e) => set('vehiclePlate', e.target.value)} /></Field>
          <div className="sm:col-span-2">
            <Field label="Purpose of visit"><Textarea rows={2} value={f.purpose} onChange={(e) => set('purpose', e.target.value)} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button
            variant="brand"
            loading={pending}
            disabled={!branchId || !f.fullName || pending}
            onClick={() =>
              submit({
                fullName: f.fullName,
                idNumber: f.idNumber || undefined,
                phone: f.phone || undefined,
                email: f.email || undefined,
                company: f.company || undefined,
                purpose: f.purpose || undefined,
                hostName: f.hostName || undefined,
                vehiclePlate: f.vehiclePlate || undefined,
              })
            }
          >
            Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}
