'use client';

import { useState } from 'react';
import { UserCheck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { useVisitors, type Visitor } from '@/lib/api/hooks/use-visitors';
import { formatRelativeDate } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

export function AdminVisitors() {
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const query = useVisitors({ search: debouncedSearch, page, limit: perPage });

  const columns: ErpColumn<Visitor>[] = [
    {
      key: 'name',
      header: 'Visitor',
      cell: (r) => (
        <div>
          <div className="font-medium">{r.fullName}</div>
          {r.idNumber && (
            <div className="font-mono text-xs text-muted-foreground">
              {r.idNumber}
            </div>
          )}
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', cell: (r) => r.phone ?? '—' },
    { key: 'company', header: 'Company', cell: (r) => r.company ?? '—' },
    { key: 'host', header: 'Host', cell: (r) => r.host ?? '—' },
    { key: 'purpose', header: 'Purpose', cell: (r) => r.purpose ?? '—' },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge variant={r.status === 'checked-in' ? 'brand' : 'success'}>
          {r.status ?? 'checked-in'}
        </Badge>
      ),
    },
    {
      key: 'in',
      header: 'Checked in',
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(r.checkInAt)}
        </span>
      ),
    },
  ];

  return (
    <ErpListPage
      title="Visitors Management"
      description="Register and track visitors at the active branch."
      actions={
        <Button
          size="sm"
          variant="brand"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Register Visitor
        </Button>
      }
      kpis={[
        {
          label: 'Currently on-site',
          value: '—',
          icon: <UserCheck className="h-4 w-4" />,
          accent: 'brand',
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
  );
}
