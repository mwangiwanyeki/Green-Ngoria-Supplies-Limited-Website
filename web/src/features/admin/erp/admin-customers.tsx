'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { formatKsh } from '@/components/admin/erp-list-shell';
import {
  useErpCustomers,
  type ErpCustomer,
} from '@/lib/api/hooks/use-erp-customers';

export function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const query = useErpCustomers({ search, page, limit: perPage });

  const columns: ErpColumn<ErpCustomer>[] = [
    {
      key: 'name',
      header: 'Customer',
      cell: (r) => <span className="font-medium">{r.name}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (r) => r.phone ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'email',
      header: 'Email',
      cell: (r) =>
        r.email ? (
          <span className="text-muted-foreground">{r.email}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'balance',
      header: <span className="text-right block">Balance</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums">
          {formatKsh(r.balance ?? 0)}
        </span>
      ),
    },
    {
      key: 'total',
      header: <span className="text-right block">Total Purchases</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums">
          {formatKsh(r.totalPurchases ?? 0)}
        </span>
      ),
    },
  ];

  return (
    <ErpListPage
      title="Customers"
      description="Retail and credit customers for the active branch."
      actions={
        <Button size="sm" variant="brand" leftIcon={<Plus className="h-4 w-4" />}>
          Add Customer
        </Button>
      }
      searchPlaceholder="Search name, phone, email…"
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
      emptyLabel="No customers yet"
      rowKey={(r) => r.id}
    />
  );
}
