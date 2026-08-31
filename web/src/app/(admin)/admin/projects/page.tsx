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
  client?: { companyName: string };
  manager?: { firstName: string; lastName: string };
}

const columns: ColumnDef<Project>[] = [
  {
    accessorKey: 'projectNumber',
    header: '#',
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
        href={`/admin/projects/${row.original.id}`}
        className="font-medium hover:text-primary transition-colors"
      >
        {row.original.name}
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
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.type.replace(/_/g, ' ')}
      </span>
    ),
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
    id: 'manager',
    header: 'PM',
    cell: ({ row }) =>
      row.original.manager
        ? `${row.original.manager.firstName} ${row.original.manager.lastName}`
        : '—',
  },
  {
    accessorKey: 'targetEndDate',
    header: 'Target',
    cell: ({ row }) => formatDate(row.original.targetEndDate),
  },
];

export default function AdminProjectsPage() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useProjects<Project>(orgId);
  const projects = data?.data ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Projects"
        description="Engineering and construction project lifecycle management"
        actions={
          <Link href="/admin/projects/new">
            <Button
              variant="brand"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              New Project
            </Button>
          </Link>
        }
      />
      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="No projects yet"
          description="Create your first project when a contract is awarded."
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
