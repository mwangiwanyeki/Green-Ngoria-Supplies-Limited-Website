'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Receipt, Wallet } from 'lucide-react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useInvoices } from '@/lib/api/hooks/use-finance';
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  dueDate: string | null;
  createdAt: string;
  client?: { companyName: string } | null;
}

const columns: ColumnDef<InvoiceRow>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: 'Invoice #',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.invoiceNumber}
      </span>
    ),
  },
  {
    id: 'client',
    header: 'Client',
    cell: ({ row }) => row.original.client?.companyName ?? '—',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    cell: ({ row }) =>
      formatCurrency(row.original.totalAmount, row.original.currency),
  },
  {
    accessorKey: 'amountDue',
    header: 'Balance Due',
    cell: ({ row }) =>
      formatCurrency(row.original.amountDue, row.original.currency),
  },
  {
    accessorKey: 'dueDate',
    header: 'Due',
    cell: ({ row }) => formatDate(row.original.dueDate),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => formatRelativeDate(row.original.createdAt),
  },
];

type Tab = 'invoices' | 'payments';

export function AdminFinanceList({
  initialTab = 'invoices',
}: {
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [page, setPage] = useState(1);
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useInvoices(orgId, {
    page,
    limit: 20,
  });

  const invoices = (data?.data as InvoiceRow[] | undefined) ?? [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Finance"
        description="Organization-scoped invoices, payment balances and receipt history."
      />
      <div className="flex gap-2 border-b border-border">
        {(['invoices', 'payments'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-brand-500 text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'invoices' ? (
        isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState retry={() => void refetch()} />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-6 w-6" />}
            title="No invoices yet"
            description="Invoices raised against clients, contracts or projects will appear here."
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={invoices}
              searchColumn="invoiceNumber"
              searchPlaceholder="Search invoices…"
            />
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={invoices.length < 20}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )
      ) : (
        <EmptyState
          icon={<Wallet className="h-6 w-6" />}
          title="Payments are recorded per invoice"
          description="Open an invoice to view or record its payment history. A consolidated payments ledger view is not yet available."
        />
      )}
    </div>
  );
}
