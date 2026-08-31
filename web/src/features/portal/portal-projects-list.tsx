'use client';

import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { PageHeader, EmptyState } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/page-header';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useProjects } from '@/lib/api/hooks/use-projects';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FolderKanban } from 'lucide-react';

interface Project {
  id: string;
  projectNumber: string;
  name: string;
  status: string;
  type: string;
  contractValue: number | null;
  currency: string;
  startDate: string | null;
  targetEndDate: string | null;
}

const columns: ColumnDef<Project>[] = [
  {
    accessorKey: 'projectNumber',
    header: 'Reference',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.projectNumber}
      </span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Project',
    cell: ({ row }) => (
      <Link
        href={`/portal/projects/${row.original.id}`}
        className="font-medium hover:text-primary transition-colors"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'contractValue',
    header: 'Value',
    cell: ({ row }) =>
      row.original.contractValue
        ? formatCurrency(row.original.contractValue, row.original.currency)
        : '—',
  },
  {
    accessorKey: 'startDate',
    header: 'Start',
    cell: ({ row }) => formatDate(row.original.startDate),
  },
  {
    accessorKey: 'targetEndDate',
    header: 'Target End',
    cell: ({ row }) => formatDate(row.original.targetEndDate),
  },
];

export function PortalProjectsList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useProjects<Project>(orgId);
  const projects = data?.data ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="My Projects"
        description="Your active and historical Green Ngoria projects"
      />
      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="No projects yet"
          description="Your project history will appear here once a contract is awarded."
        />
      ) : (
        <DataTable
          columns={columns}
          data={projects}
          searchColumn="name"
          searchPlaceholder="Search projects…"
        />
      )}
    </div>
  );
}
