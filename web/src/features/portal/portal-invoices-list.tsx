'use client';

import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { Receipt } from 'lucide-react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useInvoices } from '@/lib/api/hooks/use-finance';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  totalAmount: number;
  amountDue: number;
  dueDate: string | null;
  paidAt: string | null;
}

const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: 'Invoice #',
    cell: ({ row }) => (
      <Link
        href={`/portal/invoices/${row.original.id}`}
        className="font-mono text-xs font-medium hover:text-primary transition-colors"
      >
        {row.original.invoiceNumber}
      </Link>
    ),
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
    header: 'Due Date',
    cell: ({ row }) => formatDate(row.original.dueDate),
  },
  {
    accessorKey: 'paidAt',
    header: 'Paid',
    cell: ({ row }) =>
      row.original.paidAt ? formatDate(row.original.paidAt) : '—',
  },
];

export function PortalInvoicesList() {
  const { data, isLoading, isError, refetch } = useInvoices();
  const invoices = (data?.data ?? []) as Invoice[];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Invoices & Payments"
        description="Authorized invoices issued to your organization, balances and recorded payments."
      />
      {invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-6 w-6" />}
          title="No invoices yet"
          description="Invoices will appear here once issued by the Green Ngoria finance team."
        />
      ) : (
        <DataTable
          columns={columns}
          data={invoices}
          searchColumn="invoiceNumber"
          searchPlaceholder="Search invoices…"
        />
      )}
    </div>
  );
}
