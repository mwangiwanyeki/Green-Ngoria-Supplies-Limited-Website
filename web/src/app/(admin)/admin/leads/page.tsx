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
import { useLeads } from '@/lib/api/hooks/use-leads';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';
import { Users } from 'lucide-react';

interface Lead {
  id: string;
  reference: string;
  companyName: string;
  contactName: string;
  status: string;
  estimatedValue: number | null;
  currency: string;
  source: string;
  createdAt: string;
  owner?: { firstName: string; lastName: string };
}

const columns: ColumnDef<Lead>[] = [
  {
    accessorKey: 'reference',
    header: 'Ref',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.reference}
      </span>
    ),
  },
  {
    accessorKey: 'companyName',
    header: 'Company',
    cell: ({ row }) => (
      <Link
        href={`/admin/leads/${row.original.id}`}
        className="font-medium hover:text-primary transition-colors"
      >
        {row.original.companyName}
      </Link>
    ),
  },
  { accessorKey: 'contactName', header: 'Contact' },
  {
    accessorKey: 'status',
    header: 'Stage',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'estimatedValue',
    header: 'Est. Value',
    cell: ({ row }) =>
      row.original.estimatedValue
        ? formatCurrency(row.original.estimatedValue, row.original.currency)
        : '—',
  },
  {
    id: 'owner',
    header: 'Owner',
    cell: ({ row }) =>
      row.original.owner
        ? `${row.original.owner.firstName} ${row.original.owner.lastName}`
        : '—',
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => formatRelativeDate(row.original.createdAt),
  },
];

export default function AdminLeadsPage() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useLeads<Lead>(orgId);
  const leads = data?.data ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Leads"
        description="CRM pipeline — manage and advance mining project opportunities"
        actions={
          <Link href="/admin/leads/new">
            <Button
              variant="brand"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              New Lead
            </Button>
          </Link>
        }
      />
      {leads.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No leads yet"
          description="Create your first CRM lead to start the pipeline."
        />
      ) : (
        <DataTable
          columns={columns}
          data={leads}
          searchColumn="companyName"
          searchPlaceholder="Search leads…"
        />
      )}
    </div>
  );
}
