'use client';

import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/ui/page-header';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useQuotations } from '@/lib/api/hooks/use-quotations';
import { formatDate, formatCurrency, formatRelativeDate } from '@/lib/utils';
import { FileCheck } from 'lucide-react';

interface Quotation {
  id: string;
  quoteNumber: string;
  title: string;
  status: string;
  totalAmount: number;
  currency: string;
  validUntil: string | null;
  createdAt: string;
  client?: { companyName: string };
  revision: number;
}

const columns: ColumnDef<Quotation>[] = [
  {
    accessorKey: 'quoteNumber',
    header: 'Quote #',
    cell: ({ row }) => (
      <div>
        <span className="font-mono text-xs">{row.original.quoteNumber}</span>
        {row.original.revision > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            Rev {row.original.revision}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <Link
        href={`/admin/quotations/${row.original.id}`}
        className="font-medium hover:text-primary transition-colors line-clamp-1"
      >
        {row.original.title}
      </Link>
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
    cell: ({ row }) => (
      <span className="font-semibold text-brand-600 dark:text-brand-400">
        {formatCurrency(row.original.totalAmount, row.original.currency)}
      </span>
    ),
  },
  {
    accessorKey: 'validUntil',
    header: 'Valid Until',
    cell: ({ row }) => formatDate(row.original.validUntil),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => formatRelativeDate(row.original.createdAt),
  },
];

export default function AdminQuotationsPage() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useQuotations<Quotation>(orgId);
  const quotations = data?.data ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Quotations"
        description="Manage quotations, approvals and PDF generation"
        actions={
          <Link href="/admin/quotations/new">
            <Button
              variant="brand"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              New Quotation
            </Button>
          </Link>
        }
      />
      {quotations.length === 0 ? (
        <EmptyState
          icon={<FileCheck className="h-6 w-6" />}
          title="No quotations"
          description="Create your first quotation."
        />
      ) : (
        <DataTable
          columns={columns}
          data={quotations}
          searchColumn="title"
          searchPlaceholder="Search quotations…"
        />
      )}
    </div>
  );
}
