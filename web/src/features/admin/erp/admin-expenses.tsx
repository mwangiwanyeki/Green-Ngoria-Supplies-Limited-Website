'use client';

import { useState } from 'react';
import { Plus, Wallet, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { formatKsh } from '@/components/admin/erp-list-shell';
import {
  useExpenses,
  useExpenseStats,
  type Expense,
} from '@/lib/api/hooks/use-expenses';
import { formatRelativeDate } from '@/lib/utils';

export function AdminExpenses() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const query = useExpenses({ search, page, limit: perPage });
  const { data: stats } = useExpenseStats();

  const columns: ErpColumn<Expense>[] = [
    {
      key: 'reference',
      header: 'Reference',
      cell: (r) => (
        <span className="font-mono text-xs">{r.reference ?? r.id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (r) =>
        r.categoryName ? (
          <Badge variant="outline">{r.categoryName}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'description',
      header: 'Description',
      cell: (r) => r.description ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'amount',
      header: <span className="text-right block">Amount</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums font-medium">
          {formatKsh(r.amount)}
        </span>
      ),
    },
    {
      key: 'when',
      header: 'When',
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(r.incurredAt)}
        </span>
      ),
    },
  ];

  return (
    <ErpListPage
      title="Expenses"
      description="Expenses recorded for the active branch."
      actions={
        <Button size="sm" variant="brand" leftIcon={<Plus className="h-4 w-4" />}>
          Add Expense
        </Button>
      }
      kpis={[
        {
          label: 'Total Expenses',
          value: formatKsh(stats?.totalAmount ?? 0),
          icon: <Wallet className="h-4 w-4" />,
          accent: 'destructive',
        },
        {
          label: 'Records',
          value: stats?.recordsCount ?? 0,
          icon: <Receipt className="h-4 w-4" />,
          accent: 'default',
        },
      ]}
      searchPlaceholder="Search expenses…"
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
      emptyLabel="No expenses recorded yet"
      rowKey={(r) => r.id}
    />
  );
}
