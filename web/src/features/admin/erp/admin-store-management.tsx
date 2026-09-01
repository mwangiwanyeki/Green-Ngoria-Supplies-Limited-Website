'use client';

import { useState } from 'react';
import { Plus, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { useInventoryStores } from '@/lib/api/hooks/use-inventory';

interface Store {
  id: string;
  name: string;
  location?: string | null;
  isDefault?: boolean;
  itemsCount?: number;
}

export function AdminStoreManagement() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const query = useInventoryStores() as ReturnType<typeof useInventoryStores>;

  const columns: ErpColumn<Store>[] = [
    {
      key: 'name',
      header: 'Store',
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-brand-500" />
          <span className="font-medium">{r.name}</span>
          {r.isDefault && <Badge variant="brand">Default</Badge>}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (r) =>
        r.location ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'items',
      header: <span className="text-right block">Items</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums">
          {r.itemsCount ?? '—'}
        </span>
      ),
    },
  ];

  return (
    <ErpListPage
      title="Store Management"
      description="Storage locations and stock placement rules."
      actions={
        <Button
          size="sm"
          variant="brand"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Store
        </Button>
      }
      searchPlaceholder="Search stores…"
      columns={columns}
      query={query as never}
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
      emptyLabel="No stores configured yet"
      rowKey={(r) => r.id}
    />
  );
}
