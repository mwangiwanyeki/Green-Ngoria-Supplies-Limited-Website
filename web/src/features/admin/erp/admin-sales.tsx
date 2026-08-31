'use client';

import { useState } from 'react';
import { Receipt, Download, TrendingUp, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { formatKsh } from '@/components/admin/erp-list-shell';
import {
  useSales,
  useTodaySalesSummary,
  type Sale,
} from '@/lib/api/hooks/use-sales';
import { formatRelativeDate } from '@/lib/utils';

interface AdminSalesProps {
  scope?: 'all' | 'today';
}

export function AdminSales({ scope = 'all' }: AdminSalesProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const params: Record<string, unknown> = {
    search,
    page,
    limit: perPage,
    ...(scope === 'today' ? { period: 'today' } : {}),
  };
  const query = useSales(params);
  const { data: today } = useTodaySalesSummary();

  const columns: ErpColumn<Sale>[] = [
    {
      key: 'reference',
      header: 'Reference',
      cell: (r) => (
        <span className="font-mono text-xs">{r.reference ?? r.id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (r) => r.customerName ?? <span className="text-muted-foreground">Walk-in</span>,
    },
    {
      key: 'items',
      header: <span className="text-right block">Items</span>,
      cell: (r) => <span className="text-right block tabular-nums">{r.itemCount ?? '—'}</span>,
    },
    {
      key: 'amount',
      header: <span className="text-right block">Amount</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums font-medium">
          {formatKsh(r.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge variant={r.status === 'PAID' ? 'success' : 'warning'}>
          {r.status ?? 'PAID'}
        </Badge>
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
      title={scope === 'today' ? 'Today Sales' : 'All Sales'}
      description={
        scope === 'today'
          ? 'Sales processed today across the active branch.'
          : 'Complete sales history for the active branch.'
      }
      actions={
        <Button size="sm" variant="outline" leftIcon={<Download className="h-4 w-4" />}>
          Export
        </Button>
      }
      kpis={
        scope === 'today'
          ? [
              {
                label: 'Today',
                value: formatKsh(today?.totalAmount ?? 0),
                icon: <Receipt className="h-4 w-4" />,
                accent: 'brand',
              },
              {
                label: 'Average Sale',
                value: formatKsh(today?.averageSale ?? 0),
                icon: <TrendingUp className="h-4 w-4" />,
                accent: 'success',
              },
              {
                label: 'Sales',
                value: today?.salesCount ?? 0,
                icon: <Coins className="h-4 w-4" />,
                accent: 'default',
              },
            ]
          : undefined
      }
      searchPlaceholder="Search customer, item…"
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
      emptyLabel={scope === 'today' ? 'No sales today yet' : 'No sales yet'}
      rowKey={(r) => r.id}
    />
  );
}
