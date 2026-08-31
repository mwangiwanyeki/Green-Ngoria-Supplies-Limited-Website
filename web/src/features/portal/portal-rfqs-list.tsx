'use client';

import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { FileText } from 'lucide-react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useRfqs } from '@/lib/api/hooks/use-rfqs';
import { formatDate } from '@/lib/utils';

interface Rfq {
  id: string;
  rfqNumber: string;
  title: string;
  status: string;
  requiredByDate: string | null;
  submittedAt: string | null;
  createdAt: string;
  _count?: { items: number; quotations: number };
}

const columns: ColumnDef<Rfq>[] = [
  {
    accessorKey: 'rfqNumber',
    header: 'RFQ #',
    cell: ({ row }) => (
      <Link
        href={`/portal/rfqs/${row.original.id}`}
        className="font-mono text-xs font-medium hover:text-primary transition-colors"
      >
        {row.original.rfqNumber}
      </Link>
    ),
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'items',
    header: 'Items',
    cell: ({ row }) => row.original._count?.items ?? '—',
  },
  {
    accessorKey: 'submittedAt',
    header: 'Submitted',
    cell: ({ row }) =>
      row.original.submittedAt ? formatDate(row.original.submittedAt) : '—',
  },
  {
    accessorKey: 'requiredByDate',
    header: 'Required By',
    cell: ({ row }) => formatDate(row.original.requiredByDate),
  },
];

export function PortalRfqsList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useRfqs(orgId);
  const rfqs = (data?.data ?? []) as Rfq[];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Requests for Quotation"
        description="Equipment, spares and project RFQs raised for your organization and their current status."
      />
      {rfqs.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No RFQs yet"
          description="Requests for quotation will appear here once raised for your organization."
        />
      ) : (
        <DataTable
          columns={columns}
          data={rfqs}
          searchColumn="title"
          searchPlaceholder="Search RFQs…"
        />
      )}
    </div>
  );
}
