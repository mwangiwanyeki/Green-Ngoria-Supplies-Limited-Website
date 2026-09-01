'use client';

import { useState } from 'react';
import { Mountain, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import {
  useStockPiles,
  useStockPileStats,
  type StockPile,
} from '@/lib/api/hooks/use-stock-piles';
import { formatRelativeDate } from '@/lib/utils';

export function AdminStockPiles() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const query = useStockPiles({ search, page, limit: perPage });
  const { data: stats } = useStockPileStats();

  const columns: ErpColumn<StockPile>[] = [
    {
      key: 'name',
      header: 'Pile',
      cell: (r) => <span className="font-medium">{r.name}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      cell: (r) =>
        r.location ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'tonnage',
      header: <span className="text-right block">Tonnage</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums">
          {r.tonnage ?? 0} t
        </span>
      ),
    },
    {
      key: 'grade',
      header: <span className="text-right block">Grade</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums">
          {r.grade ? `${r.grade} ${r.gradeUnit ?? 'g/t'}` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) =>
        r.status ? (
          <Badge variant="outline">{r.status}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'updated',
      header: 'Updated',
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(r.updatedAt)}
        </span>
      ),
    },
  ];

  return (
    <ErpListPage
      title="Stock Piles"
      description="Ore stockpile tracking: tonnage, grade and movements."
      actions={
        <Button
          size="sm"
          variant="brand"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Pile
        </Button>
      }
      kpis={[
        {
          label: 'Total Tonnage',
          value: `${stats?.totalTonnage ?? 0} t`,
          icon: <Scale className="h-4 w-4" />,
          accent: 'brand',
        },
        {
          label: 'Piles',
          value: stats?.pilesCount ?? 0,
          icon: <Mountain className="h-4 w-4" />,
          accent: 'default',
        },
        {
          label: 'Avg Grade',
          value: stats?.averageGrade ? `${stats.averageGrade} g/t` : '—',
          accent: 'success',
        },
      ]}
      searchPlaceholder="Search stockpiles…"
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
      emptyLabel="No stock piles yet"
      rowKey={(r) => r.id}
    />
  );
}
