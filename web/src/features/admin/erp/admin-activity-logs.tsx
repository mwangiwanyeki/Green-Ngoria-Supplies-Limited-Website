'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import {
  useActivityLogs,
  type ActivityLogEntry,
} from '@/lib/api/hooks/use-activity-logs';
import { formatRelativeDate } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

export function AdminActivityLogs() {
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const query = useActivityLogs({ search: debouncedSearch, page, limit: perPage });

  const columns: ErpColumn<ActivityLogEntry>[] = [
    {
      key: 'actor',
      header: 'Actor',
      cell: (r) => (
        <div>
          <div className="font-medium">{r.actorName ?? '—'}</div>
          {r.actorEmail && (
            <div className="text-xs text-muted-foreground">{r.actorEmail}</div>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      cell: (r) => (
        <Badge variant="outline" className="font-mono text-xs">
          {r.action}
        </Badge>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      cell: (r) => (
        <span className="text-xs">
          {r.entityType}
          {r.entityId && (
            <span className="ml-1 font-mono text-muted-foreground">
              {r.entityId.slice(0, 8)}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'ip',
      header: 'IP',
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {r.ip ?? '—'}
        </span>
      ),
    },
    {
      key: 'when',
      header: 'When',
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(r.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <ErpListPage
      title="Activity Logs"
      description="Audit trail of user actions across the platform."
      searchPlaceholder="Search actor, action, entity…"
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
      emptyLabel="No activity yet"
      rowKey={(r) => r.id}
    />
  );
}
