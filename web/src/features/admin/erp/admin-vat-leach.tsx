'use client';

import { useState } from 'react';
import { Coins, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { formatKsh } from '@/components/admin/erp-list-shell';
import {
  useVatLeachRentals,
  useVatLeachStats,
  type VatLeachRental,
} from '@/lib/api/hooks/use-vat-leach';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

export function AdminVatLeach() {
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState<
    'all' | 'active' | 'completed' | 'overdue'
  >('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const query = useVatLeachRentals({ search: debouncedSearch, status, page, limit: perPage });
  const { data: stats } = useVatLeachStats();

  const columns: ErpColumn<VatLeachRental>[] = [
    {
      key: 'renter',
      header: 'Renter',
      cell: (r) => <span className="font-medium">{r.renterName}</span>,
    },
    {
      key: 'vat',
      header: 'Vat',
      cell: (r) => (
        <span className="font-mono text-xs">{r.vatCode ?? '—'}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (r) => r.phone ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'location',
      header: 'Location',
      cell: (r) =>
        r.location ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'deposit',
      header: <span className="text-right block">Deposit</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums">
          {formatKsh(r.depositAmount ?? 0)}
        </span>
      ),
    },
    {
      key: 'balance',
      header: <span className="text-right block">Balance</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums font-semibold">
          {formatKsh(r.balanceDue ?? 0)}
        </span>
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
              : r.status === 'completed'
                ? 'success'
                : 'brand'
          }
        >
          {r.status ?? 'active'}
        </Badge>
      ),
    },
  ];

  return (
    <ErpListPage
      title="Vat Leach"
      description="Gold-processing vat rentals: renter assignments, deposits and payments."
      kpis={[
        {
          label: 'Deposits Held',
          value: formatKsh(stats?.depositsHeld ?? 0),
          icon: <Coins className="h-4 w-4" />,
          accent: 'brand',
        },
        {
          label: 'Active Rentals',
          value: stats?.activeRentals ?? 0,
          accent: 'success',
        },
        {
          label: 'Overdue',
          value: stats?.overdueCount ?? 0,
          icon: <AlertTriangle className="h-4 w-4" />,
          accent: 'destructive',
        },
      ]}
      searchPlaceholder="Search renter, vat, phone, location…"
      filterChips={[
        { key: 'all', label: 'All' },
        { key: 'active', label: 'Active' },
        { key: 'overdue', label: 'Overdue' },
        { key: 'completed', label: 'Completed' },
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
      emptyLabel="No vat leaches assigned yet"
      rowKey={(r) => r.id}
    />
  );
}
