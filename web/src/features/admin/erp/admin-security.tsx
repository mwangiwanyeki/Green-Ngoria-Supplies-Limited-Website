'use client';

import { useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertOctagon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import {
  useSecurityLogs,
  useSecurityStats,
  type SecurityLog,
} from '@/lib/api/hooks/use-site-security';
import { formatRelativeDate } from '@/lib/utils';

export function AdminSecurity() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<
    'all' | 'open' | 'resolved' | 'investigating'
  >('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const query = useSecurityLogs({ search, status, page, limit: perPage });
  const { data: stats } = useSecurityStats();

  const columns: ErpColumn<SecurityLog>[] = [
    {
      key: 'incident',
      header: 'Incident',
      cell: (r) => (
        <div>
          <div className="font-medium">{r.incidentType}</div>
          {r.description && (
            <div className="line-clamp-1 text-xs text-muted-foreground">
              {r.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      cell: (r) => (
        <Badge
          variant={
            r.severity === 'critical' || r.severity === 'high'
              ? 'destructive'
              : r.severity === 'medium'
                ? 'warning'
                : 'outline'
          }
        >
          {r.severity ?? '—'}
        </Badge>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (r) =>
        r.location ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'reporter',
      header: 'Reported by',
      cell: (r) =>
        r.reportedBy ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge
          variant={
            r.status === 'resolved'
              ? 'success'
              : r.status === 'investigating'
                ? 'warning'
                : 'brand'
          }
        >
          {r.status ?? 'open'}
        </Badge>
      ),
    },
    {
      key: 'when',
      header: 'When',
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(r.occurredAt)}
        </span>
      ),
    },
  ];

  return (
    <ErpListPage
      title="Site Security"
      description="Security logs, incidents and guard shift entries for the active branch."
      actions={
        <Button
          size="sm"
          variant="brand"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Log Incident
        </Button>
      }
      kpis={[
        {
          label: 'Open',
          value: stats?.openCount ?? 0,
          icon: <ShieldAlert className="h-4 w-4" />,
          accent: 'warning',
        },
        {
          label: 'Resolved',
          value: stats?.resolvedCount ?? 0,
          icon: <ShieldCheck className="h-4 w-4" />,
          accent: 'success',
        },
        {
          label: 'Critical',
          value: stats?.criticalCount ?? 0,
          icon: <AlertOctagon className="h-4 w-4" />,
          accent: 'destructive',
        },
      ]}
      searchPlaceholder="Search incidents…"
      filterChips={[
        { key: 'all', label: 'All' },
        { key: 'open', label: 'Open' },
        { key: 'investigating', label: 'Investigating' },
        { key: 'resolved', label: 'Resolved' },
      ]}
      filterValue={status}
      onFilterChange={(k) => {
        setStatus(k as typeof status);
        setPage(1);
      }}
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
      emptyLabel="No security logs yet"
      rowKey={(r) => r.id}
    />
  );
}
