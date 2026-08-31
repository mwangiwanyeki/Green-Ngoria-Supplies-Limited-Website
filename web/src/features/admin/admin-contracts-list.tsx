'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { FileSignature } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/ui/page-header';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useContracts } from '@/lib/api/hooks/use-contracts';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  status: string;
  currency: string;
  value: number;
  retentionPct: number;
  paymentTerms?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  client?: { id: string; companyName: string } | null;
}

const columns: ColumnDef<Contract>[] = [
  {
    accessorKey: 'contractNumber',
    header: 'Contract #',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.contractNumber}
      </span>
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
    accessorKey: 'value',
    header: 'Value',
    cell: ({ row }) =>
      formatCurrency(row.original.value, row.original.currency),
  },
  {
    accessorKey: 'startDate',
    header: 'Start',
    cell: ({ row }) => formatDate(row.original.startDate),
  },
  {
    accessorKey: 'endDate',
    header: 'End',
    cell: ({ row }) => formatDate(row.original.endDate),
  },
];

export function AdminContractsList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useContracts<Contract>(orgId);
  const contracts = data?.data ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Contracts"
        description="Controlled commercial terms, milestones, approvals and project linkage."
      />
      {contracts.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="h-6 w-6" />}
          title="No contracts yet"
          description="Contracts appear here once drafted against a client or project."
        />
      ) : (
        <DataTable
          columns={columns}
          data={contracts}
          searchColumn="title"
          searchPlaceholder="Search contracts…"
        />
      )}
    </div>
  );
}
