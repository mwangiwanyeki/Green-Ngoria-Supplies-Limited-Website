'use client';

import { useState } from 'react';
import { Download, Plus, Tag, Package, PackageX, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { formatKsh } from '@/components/admin/erp-list-shell';
import {
  useInventoryItems,
  useInventoryStats,
  type InventoryItem,
} from '@/lib/api/hooks/use-inventory';

export function AdminInventory() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const query = useInventoryItems({ search, filter, page, limit: perPage });
  const { data: stats } = useInventoryStats();

  const columns: ErpColumn<InventoryItem>[] = [
    {
      key: 'item',
      header: 'Item',
      cell: (r) => <span className="font-medium">{r.name}</span>,
    },
    { key: 'sku', header: 'SKU', cell: (r) => <span className="font-mono text-xs">{r.sku}</span> },
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
      key: 'price',
      header: <span className="text-right block">Price</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums">
          {formatKsh(r.unitPrice ?? 0)}
        </span>
      ),
    },
    {
      key: 'qty',
      header: <span className="text-right block">Qty</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums">
          {r.quantity ?? 0} pcs
        </span>
      ),
    },
  ];

  return (
    <ErpListPage
      title="Inventory"
      description="Stock items scoped to the active branch."
      actions={
        <>
          <Button size="sm" variant="outline" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Button size="sm" variant="outline" leftIcon={<Tag className="h-4 w-4" />}>
            Price Tags
          </Button>
          <Button size="sm" variant="brand" leftIcon={<Plus className="h-4 w-4" />}>
            Add Item
          </Button>
        </>
      }
      kpis={[
        {
          label: 'Stock on Hand',
          value: formatKsh(stats?.totalValue ?? 0),
          sub: `${stats?.totalItems ?? 0} items`,
          icon: <Boxes className="h-4 w-4" />,
          accent: 'brand',
        },
        {
          label: 'In Stock',
          value: stats?.inStock ?? 0,
          icon: <Package className="h-4 w-4" />,
          accent: 'success',
        },
        {
          label: 'Low Stock',
          value: stats?.lowStock ?? 0,
          icon: <Package className="h-4 w-4" />,
          accent: 'warning',
        },
        {
          label: 'Out of Stock',
          value: stats?.outOfStock ?? 0,
          icon: <PackageX className="h-4 w-4" />,
          accent: 'destructive',
        },
      ]}
      searchPlaceholder="Search by name, SKU, category…"
      filterChips={[
        { key: 'all', label: 'All' },
        { key: 'low', label: 'Low Stock' },
        { key: 'out', label: 'Out of Stock' },
      ]}
      filterValue={filter}
      onFilterChange={(k) => {
        setFilter(k as 'all' | 'low' | 'out');
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
      emptyLabel="No inventory items yet"
      rowKey={(r) => r.id}
    />
  );
}
