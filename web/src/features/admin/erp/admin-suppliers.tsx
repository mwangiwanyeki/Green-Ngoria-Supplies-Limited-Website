'use client';

import { useState } from 'react';
import { Plus, Truck, Package, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { formatKsh } from '@/components/admin/erp-list-shell';
import {
  useSuppliers,
  useSupplierStats,
  type Supplier,
} from '@/lib/api/hooks/use-suppliers';

export function AdminSuppliers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const query = useSuppliers({ search, page, limit: perPage });
  const { data: stats } = useSupplierStats();

  const columns: ErpColumn<Supplier>[] = [
    {
      key: 'idx',
      header: '#',
      cell: (r) => <span className="text-muted-foreground">{r.id.slice(0, 6)}</span>,
      className: 'px-4 py-3 text-xs font-mono',
    },
    {
      key: 'name',
      header: 'Supplier Name',
      cell: (r) => <span className="font-medium">{r.name}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (r) => r.phone ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'company',
      header: 'Company',
      cell: (r) => r.company ?? <span className="text-muted-foreground">—</span>,
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
  ];

  return (
    <ErpListPage
      title="Suppliers"
      description="Vendors and purchase order pipeline."
      actions={
        <Button size="sm" variant="brand" leftIcon={<Plus className="h-4 w-4" />}>
          Add Supplier
        </Button>
      }
      kpis={[
        {
          label: 'Total Orders',
          value: stats?.totalOrders ?? 0,
          icon: <Package className="h-4 w-4" />,
          accent: 'brand',
        },
        {
          label: 'Order Value',
          value: formatKsh(stats?.orderValue ?? 0),
          icon: <Truck className="h-4 w-4" />,
          accent: 'success',
        },
        {
          label: 'Pending Orders',
          value: stats?.pendingOrders ?? 0,
          icon: <Clock className="h-4 w-4" />,
          accent: 'warning',
        },
      ]}
      searchPlaceholder="Search name, phone, email, company…"
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
      emptyLabel="No suppliers yet"
      rowKey={(r) => r.id}
    />
  );
}
