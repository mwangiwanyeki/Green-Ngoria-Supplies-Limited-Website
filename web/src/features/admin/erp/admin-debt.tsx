'use client';

import { useState } from 'react';
import { HandCoins, AlertTriangle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { formatKsh } from '@/components/admin/erp-list-shell';
import {
  useDebtAccounts,
  useDebtStats,
  type DebtAccount,
} from '@/lib/api/hooks/use-debt';

export function AdminDebt() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'current' | 'overdue' | 'settled'>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const query = useDebtAccounts({ search, status, page, limit: perPage });
  const { data: stats } = useDebtStats();

  const columns: ErpColumn<DebtAccount>[] = [
    {
      key: 'customer',
      header: 'Customer',
      cell: (r) => <span className="font-medium">{r.customerName}</span>,
    },
    {
      key: 'outstanding',
      header: <span className="text-right block">Outstanding</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums font-semibold">
          {formatKsh(r.outstanding)}
        </span>
      ),
    },
    {
      key: 'overdue',
      header: 'Overdue',
      cell: (r) =>
        r.overdueDays && r.overdueDays > 0 ? (
          <Badge variant="destructive">{r.overdueDays} days</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">On time</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge
          variant={
            r.status === 'overdue'
              ? 'destructive'
              : r.status === 'settled'
                ? 'success'
                : 'brand'
          }
        >
          {r.status ?? 'current'}
        </Badge>
      ),
    },
  ];

  return (
    <ErpListPage
      title="Manage Debt"
      description="Customer credit balances and overdue accounts."
      kpis={[
        {
          label: 'Outstanding Debt',
          value: formatKsh(stats?.totalOutstanding ?? 0),
          icon: <HandCoins className="h-4 w-4" />,
          accent: 'brand',
        },
        {
          label: 'Overdue',
          value: stats?.overdueCount ?? 0,
          icon: <AlertTriangle className="h-4 w-4" />,
          accent: 'destructive',
        },
        {
          label: 'Customers',
          value: stats?.customerCount ?? 0,
          icon: <Users className="h-4 w-4" />,
          accent: 'default',
        },
      ]}
      searchPlaceholder="Search customer…"
      filterChips={[
        { key: 'all', label: 'All' },
        { key: 'current', label: 'Current' },
        { key: 'overdue', label: 'Overdue' },
        { key: 'settled', label: 'Settled' },
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
      emptyLabel="No debt accounts yet"
      rowKey={(r) => r.id}
    />
  );
}
