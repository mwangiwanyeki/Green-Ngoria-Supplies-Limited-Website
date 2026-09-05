'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ExternalLink,
  Trash2,
  Filter,
  Sparkles,
} from 'lucide-react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useDismissNotification,
  useClearReadNotifications,
} from '@/lib/api/hooks/use-notifications';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { formatRelativeDate, cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

type FilterKey = 'all' | 'unread' | 'read';

// Human labels for the type filter — chip appears only if a row of that type
// is present in the current page.
const TYPE_LABEL: Record<string, string> = {
  LEAD_CREATED: 'Lead',
  LEAD_UPDATED: 'Lead',
  QUOTATION_APPROVED: 'Quotation',
  QUOTATION_REJECTED: 'Quotation',
  PROJECT_MILESTONE: 'Project',
  ASSESSMENT_UPDATED: 'Assessment',
  INVOICE_ISSUED: 'Invoice',
  INVOICE_OVERDUE: 'Invoice',
  RFQ_SUBMITTED: 'RFQ',
  ACCOUNT_SECURITY: 'Security',
};

function bucket(iso: string): 'today' | 'week' | 'earlier' {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (now - t < dayMs) return 'today';
  if (now - t < 7 * dayMs) return 'week';
  return 'earlier';
}

export function AdminNotificationsList() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [clearReadOpen, setClearReadOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useNotifications<Notification>({
    unreadOnly: filter === 'unread',
    page: 1,
    limit: 100,
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const dismiss = useDismissNotification();
  const clearRead = useClearReadNotifications();

  const allNotifications = data?.data ?? [];

  // "Read" is served by filtering client-side because the endpoint only
  // supports "unreadOnly"; both cases still fetch under 100 rows and this
  // keeps the filter chip UX snappy.
  const notifications = useMemo(() => {
    let rows = allNotifications;
    if (filter === 'read') rows = rows.filter((n) => n.readAt);
    if (typeFilter) rows = rows.filter((n) => n.type === typeFilter);
    return rows;
  }, [allNotifications, filter, typeFilter]);

  const unreadCount = allNotifications.filter((n) => !n.readAt).length;
  const typeCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of allNotifications) {
      map.set(n.type, (map.get(n.type) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [allNotifications]);

  const grouped = useMemo(() => {
    const g: Record<'today' | 'week' | 'earlier', Notification[]> = {
      today: [],
      week: [],
      earlier: [],
    };
    for (const n of notifications) g[bucket(n.createdAt)].push(n);
    return g;
  }, [notifications]);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  const onClickRow = (n: Notification) => {
    if (!n.readAt) {
      markRead.mutate(n.id);
    }
  };

  const onDismiss = (n: Notification) => {
    dismiss.mutate(n.id, {
      onSuccess: () => toast.success('Notification dismissed'),
      onError: (err) =>
        toast.error(getApiErrorMessage(err, 'Could not dismiss notification')),
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Notifications"
        description="System-wide updates on leads, projects, assessments, RFQs, invoices, and account security."
        badge={
          unreadCount > 0 ? (
            <Badge variant="brand">{unreadCount} unread</Badge>
          ) : undefined
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={unreadCount === 0 || markAllRead.isPending}
              leftIcon={<CheckCheck className="h-4 w-4" />}
              onClick={() =>
                markAllRead.mutate(undefined, {
                  onSuccess: () => toast.success('Marked all as read'),
                })
              }
            >
              Mark all read
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                allNotifications.every((n) => !n.readAt) || clearRead.isPending
              }
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setClearReadOpen(true)}
            >
              Clear read
            </Button>
          </>
        }
      />

      {/* Filter chips: read/unread + type slice. */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'unread', 'read'] as FilterKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filter === k
                ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                : 'border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {k === 'all' ? 'All' : k === 'unread' ? `Unread (${unreadCount})` : 'Read'}
          </button>
        ))}
        {typeCounts.length > 1 && (
          <>
            <span className="mx-1 text-muted-foreground">
              <Filter className="inline h-3 w-3" />
            </span>
            <button
              onClick={() => setTypeFilter(null)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                !typeFilter
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              Any type
            </button>
            {typeCounts.slice(0, 8).map(([t, count]) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  typeFilter === t
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {TYPE_LABEL[t] ?? t.replace(/_/g, ' ').toLowerCase()}
                <span className="ml-1.5 tabular-nums text-[10px] opacity-70">
                  {count}
                </span>
              </button>
            ))}
          </>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<BellRing className="h-6 w-6" />}
          title={
            filter === 'unread'
              ? 'No unread notifications'
              : filter === 'read'
                ? 'No read notifications'
                : 'No notifications yet'
          }
          description="You'll see updates here as things happen across the organization."
        />
      ) : (
        <div className="space-y-6">
          {(['today', 'week', 'earlier'] as const).map((section) => {
            const rows = grouped[section];
            if (rows.length === 0) return null;
            const label =
              section === 'today'
                ? 'Today'
                : section === 'week'
                  ? 'This week'
                  : 'Earlier';
            return (
              <section key={section}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label} · {rows.length}
                </h2>
                <ul className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline bg-card">
                  {rows.map((n) => (
                    <li key={n.id}>
                      <NotificationRow
                        n={n}
                        onClickRow={onClickRow}
                        onMarkRead={() => markRead.mutate(n.id)}
                        onDismiss={() => onDismiss(n)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={clearReadOpen}
        onOpenChange={setClearReadOpen}
        title="Clear all read notifications?"
        description="This permanently removes every already-read notification. Unread notifications will be kept."
        confirmLabel="Clear read"
        destructive
        onConfirm={() => {
          clearRead.mutate(undefined, {
            onSuccess: (res) => {
              const removed = (res as { removed?: number } | undefined)?.removed;
              toast.success(
                removed ? `Cleared ${removed} notifications` : 'Cleared',
              );
              setClearReadOpen(false);
            },
            onError: (err) => {
              toast.error(getApiErrorMessage(err, 'Could not clear'));
              setClearReadOpen(false);
            },
          });
        }}
      />
    </div>
  );
}

function NotificationRow({
  n,
  onClickRow,
  onMarkRead,
  onDismiss,
}: {
  n: Notification;
  onClickRow: (n: Notification) => void;
  onMarkRead: () => void;
  onDismiss: () => void;
}) {
  const unread = !n.readAt;
  const typeLabel = TYPE_LABEL[n.type] ?? n.type.replace(/_/g, ' ').toLowerCase();

  const body = (
    <div className="flex items-start gap-3 p-4">
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          unread
            ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400'
            : 'bg-muted text-muted-foreground',
        )}
        aria-hidden="true"
      >
        {unread ? (
          <Sparkles className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'truncate text-sm',
              unread ? 'font-semibold text-foreground' : 'text-muted-foreground',
            )}
          >
            {n.title}
          </span>
          <Badge variant="outline" className="capitalize text-[10px]">
            {typeLabel}
          </Badge>
          {unread && (
            <span
              className="inline-block h-2 w-2 rounded-full bg-brand-500"
              aria-label="Unread"
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {n.message}
        </p>
        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
          <span>{formatRelativeDate(n.createdAt)}</span>
          {n.actionUrl && (
            <span className="inline-flex items-center gap-1 text-brand-500">
              <ExternalLink className="h-3 w-3" />
              Open
            </span>
          )}
        </div>
      </div>

      <div className="ml-2 flex shrink-0 items-center gap-1">
        {unread && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mark as read"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMarkRead();
            }}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Dismiss"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const commonClass = cn(
    'block transition-colors',
    unread ? 'bg-brand-500/5 hover:bg-brand-500/10' : 'hover:bg-muted/40',
  );

  return n.actionUrl ? (
    <Link
      href={n.actionUrl}
      className={commonClass}
      onClick={() => onClickRow(n)}
    >
      {body}
    </Link>
  ) : (
    <button
      type="button"
      className={cn(commonClass, 'w-full text-left')}
      onClick={() => onClickRow(n)}
    >
      {body}
    </button>
  );
}
