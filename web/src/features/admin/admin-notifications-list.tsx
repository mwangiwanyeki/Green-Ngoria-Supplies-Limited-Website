'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { BellRing, CheckCheck } from 'lucide-react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/lib/api/hooks/use-notifications';
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

export function AdminNotificationsList() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, isLoading, isError, refetch } = useNotifications<Notification>({
    unreadOnly,
    page: 1,
    limit: 50,
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const columns: ColumnDef<Notification>[] = [
    {
      accessorKey: 'title',
      header: 'Notification',
      cell: ({ row }) => (
        <button
          onClick={() => {
            if (!row.original.readAt) markRead.mutate(row.original.id);
          }}
          className="flex flex-col items-start gap-0.5 text-left"
        >
          <span
            className={cn(
              'font-medium',
              !row.original.readAt && 'text-foreground',
              row.original.readAt && 'text-muted-foreground',
            )}
          >
            {row.original.title}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.message}
          </span>
        </button>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.type.replace(/_/g, ' ').toLowerCase()}
        </Badge>
      ),
    },
    {
      accessorKey: 'readAt',
      header: 'Status',
      cell: ({ row }) =>
        row.original.readAt ? (
          <Badge variant="mineral">Read</Badge>
        ) : (
          <Badge variant="brand">Unread</Badge>
        ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Received',
      cell: ({ row }) => formatRelativeDate(row.original.createdAt),
    },
  ];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Notifications"
        description="System-wide updates on leads, projects, assessments, RFQs and account activity."
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
              onClick={() => setUnreadOnly((v) => !v)}
            >
              {unreadOnly ? 'Show all' : 'Unread only'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={unreadCount === 0 || markAllRead.isPending}
              leftIcon={<CheckCheck className="h-4 w-4" />}
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </Button>
          </>
        }
      />
      {notifications.length === 0 ? (
        <EmptyState
          icon={<BellRing className="h-6 w-6" />}
          title={
            unreadOnly ? 'No unread notifications' : 'No notifications yet'
          }
          description="You'll see updates here as things happen across the organization."
        />
      ) : (
        <DataTable columns={columns} data={notifications} />
      )}
    </div>
  );
}
