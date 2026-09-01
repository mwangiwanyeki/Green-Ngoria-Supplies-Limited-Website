'use client';

import { useMemo, useState } from 'react';
import {
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Shield,
  LogIn,
  LogOut,
  Pencil,
  Trash2,
  UserPlus,
  FileCheck,
  DollarSign,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useAuditLogs,
  useAuditLogFacets,
  type AuditLogView,
} from '@/lib/api/hooks/use-audit-logs';
import { formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 25;

/** Keyed on a substring of the action so the whole AuditAction enum is covered. */
const ACTION_ICON_RULES: {
  match: RegExp;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { match: /LOGIN/, icon: LogIn, color: 'bg-sky-500/10 text-sky-600' },
  { match: /LOGOUT/, icon: LogOut, color: 'bg-slate-500/10 text-slate-500' },
  {
    match: /CREATED|REGISTERED|UPLOADED|INVITED/,
    icon: UserPlus,
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    match: /UPDATED|CHANGED|EDITED/,
    icon: Pencil,
    color: 'bg-amber-500/10 text-amber-600',
  },
  {
    match: /DELETED|REMOVED|REVOKED/,
    icon: Trash2,
    color: 'bg-red-500/10 text-red-500',
  },
  {
    match: /APPROVED|PUBLISHED|COMPLETED|SIGNED/,
    icon: FileCheck,
    color: 'bg-teal-500/10 text-teal-600',
  },
  {
    match: /PAYMENT|INVOICE|PAID/,
    icon: DollarSign,
    color: 'bg-indigo-500/10 text-indigo-600',
  },
  {
    match: /ROLE|PERMISSION/,
    icon: Shield,
    color: 'bg-violet-500/10 text-violet-600',
  },
  {
    match: /INCIDENT|REJECTED|FAILED/,
    icon: AlertTriangle,
    color: 'bg-orange-500/10 text-orange-600',
  },
];

function actionStyle(action: string) {
  const rule = ACTION_ICON_RULES.find((r) => r.match.test(action));
  return {
    Icon: rule?.icon ?? Eye,
    color: rule?.color ?? 'bg-muted text-muted-foreground',
  };
}

/** Render any JSON value as a short single-line string. */
function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return value.toString();
  return JSON.stringify(value) ?? '—';
}

/**
 * `details` is the raw `newValues`/`metadata` JSON — flatten it to one line.
 * Prisma serves `Json` columns back as a JSON *string* over the wire, so try a
 * parse first before falling back to showing the raw text.
 */
function summariseDetails(details: unknown): string | null {
  if (details === null || details === undefined) return null;
  if (typeof details === 'string') {
    if (!details) return null;
    try {
      const parsed: unknown = JSON.parse(details);
      if (parsed && typeof parsed === 'object') return summariseDetails(parsed);
    } catch {
      /* Not JSON — show it verbatim. */
    }
    return details;
  }
  if (typeof details !== 'object') return renderValue(details);
  const entries = Object.entries(details as Record<string, unknown>);
  if (entries.length === 0) return null;
  return entries
    .map(([key, value]) => `${key}: ${renderValue(value)}`)
    .join(' · ');
}

export function AdminAuditList() {
  const { data: me } = useMe();
  const orgId = me?.organizationId ?? '';

  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const { data: facets } = useAuditLogFacets(orgId);

  const params = useMemo(() => {
    const next: Record<string, unknown> = { page, limit: PAGE_SIZE };
    if (search.trim()) next.search = search.trim();
    if (action) next.action = action;
    if (entity) next.entity = entity;
    if (from) next.from = new Date(`${from}T00:00:00`).toISOString();
    // Make the upper bound inclusive of the whole selected day.
    if (to) next.to = new Date(`${to}T23:59:59.999`).toISOString();
    return next;
  }, [page, search, action, entity, from, to]);

  const { data, isLoading, isError, refetch, isFetching } = useAuditLogs(
    orgId,
    params,
  );

  const entries: AuditLogView[] = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.pages ?? 1;

  const filtersActive = !!(search || action || entity || from || to);

  const resetFilters = () => {
    setSearch('');
    setAction('');
    setEntity('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const actionOptions = facets?.actions ?? [];
  const entityOptions = facets?.entities ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Append-only evidence for authentication, permissions, approvals and critical business changes."
        badge={
          <Badge variant="mineral" className="text-[10px]">
            {meta?.total ?? entries.length} entries
          </Badge>
        }
      />

      {/* Filters */}
      <div className="glass-card space-y-4 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[220px] max-w-md flex-1">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="h-4 w-4" />}
              placeholder="Search by actor, entity or action…"
              className="h-9 bg-muted/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={from}
              max={to || undefined}
              aria-label="From date"
              className="h-9 w-40"
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={to}
              min={from || undefined}
              aria-label="To date"
              className="h-9 w-40"
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            value={entity}
            aria-label="Entity"
            className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            onChange={(e) => {
              setEntity(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All entities</option>
            {entityOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          {filtersActive && (
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<X className="h-3.5 w-3.5" />}
              onClick={resetFilters}
            >
              Clear
            </Button>
          )}
          {isFetching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {actionOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setAction('');
                setPage(1);
              }}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                action === ''
                  ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              All Events
            </button>
            {actionOptions.map((value) => (
              <button
                key={value}
                onClick={() => {
                  setAction(value);
                  setPage(1);
                }}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  action === value
                    ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                    : 'border-border text-muted-foreground hover:bg-muted',
                )}
              >
                {value.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Audit entries */}
      {entries.length === 0 ? (
        <EmptyState
          icon={<History className="h-6 w-6" />}
          title={
            filtersActive ? 'No matching audit entries' : 'No audit entries'
          }
          description={
            filtersActive
              ? 'Try widening the date range or clearing the action filter.'
              : 'Audit events appear here as users interact with the platform.'
          }
          action={
            filtersActive ? (
              <Button variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="glass-card divide-y divide-border/40 overflow-hidden rounded-xl">
            {entries.map((entry, i) => {
              const { Icon, color } = actionStyle(entry.action);
              const details = summariseDetails(entry.details);

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i, 15) * 0.02 }}
                  className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/20"
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      color,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {entry.actorName || entry.actorEmail}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {entry.action.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {entry.entityType}
                        {entry.entityId && (
                          <span className="ml-1 font-mono text-xs">
                            {entry.entityId.slice(0, 8)}
                          </span>
                        )}
                      </span>
                    </div>
                    {details && (
                      <p
                        className="mt-1 max-w-[640px] truncate text-xs text-muted-foreground"
                        title={details}
                      >
                        {details}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span title={new Date(entry.createdAt).toLocaleString()}>
                        {formatRelativeDate(entry.createdAt)}
                      </span>
                      {entry.actorEmail && <span>{entry.actorEmail}</span>}
                      {entry.ipAddress && <span>IP: {entry.ipAddress}</span>}
                      {entry.organizationName && (
                        <span>Org: {entry.organizationName}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {meta?.page ?? page} of {totalPages} · {meta?.total ?? 0}{' '}
                entries
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
