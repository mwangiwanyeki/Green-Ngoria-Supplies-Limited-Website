'use client';

import { useState } from 'react';
import { Plus, Landmark, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { formatKsh } from '@/components/admin/erp-list-shell';
import {
  useAccounts,
  useAccountsSummary,
  type Account,
} from '@/lib/api/hooks/use-accounts';

export function AdminAccounts() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const query = useAccounts({ search, page, limit: perPage });
  const { data: summary } = useAccountsSummary();

  const columns: ErpColumn<Account>[] = [
    {
      key: 'name',
      header: 'Account',
      cell: (r) => (
        <div>
          <div className="font-medium">{r.name}</div>
          {r.code && <div className="font-mono text-xs text-muted-foreground">{r.code}</div>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (r) =>
        r.type ? (
          <Badge variant="outline">{r.type}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'balance',
      header: <span className="text-right block">Balance</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums font-semibold">
          {formatKsh(r.balance)}
        </span>
      ),
    },
  ];

  return (
    <ErpListPage
      title="Accounts"
      description="Account balances and manual ledger entries."
      actions={
        <>
          <Button size="sm" variant="outline" leftIcon={<FileText className="h-4 w-4" />}>
            Manual Entry
          </Button>
          <Button size="sm" variant="brand" leftIcon={<Plus className="h-4 w-4" />}>
            Add New
          </Button>
        </>
      }
      kpis={[
        {
          label: 'Total Balance',
          value: formatKsh(summary?.totalBalance ?? 0),
          icon: <Landmark className="h-4 w-4" />,
          accent: 'brand',
        },
        {
          label: 'Accounts',
          value: summary?.accountsCount ?? 0,
          icon: <FileText className="h-4 w-4" />,
          accent: 'default',
        },
      ]}
      searchPlaceholder="Search accounts…"
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
      emptyLabel="No accounts yet"
      rowKey={(r) => r.id}
    />
  );
}
