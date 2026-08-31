'use client';

import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/ui/page-header';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useQuotations } from '@/lib/api/hooks/use-quotations';
import { formatDate, formatCurrency } from '@/lib/utils';
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
}

const columns: ColumnDef<Quotation>[] = [
  {
    accessorKey: 'quoteNumber',
    header: 'Quote #',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.quoteNumber}</span>
    ),
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <Link
        href={`/portal/quotations/${row.original.id}`}
        className="font-medium hover:text-primary transition-colors"
      >
        {row.original.title}
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
    accessorKey: 'validUntil',
    header: 'Valid Until',
    cell: ({ row }) => formatDate(row.original.validUntil),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];

export default function PortalQuotationsPage() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useQuotations<Quotation>(orgId);
  const quotations = data?.data ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Quotations"
        description="Quotations issued by Green Ngoria for your projects and RFQs"
      />
      {quotations.length === 0 ? (
        <EmptyState
          icon={<FileCheck className="h-6 w-6" />}
          title="No quotations yet"
          description="Quotations will appear here once submitted by the Green Ngoria commercial team."
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
