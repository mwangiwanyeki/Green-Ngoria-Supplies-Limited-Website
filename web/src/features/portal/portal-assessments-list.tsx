'use client';

import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { ClipboardList } from 'lucide-react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useAssessments } from '@/lib/api/hooks/use-assessments';
import { formatDate } from '@/lib/utils';

interface Assessment {
  id: string;
  reference: string;
  clientName: string;
  projectName: string | null;
  miningLocation: string | null;
  mineralType: string | null;
  status: string;
  createdAt: string;
}

const columns: ColumnDef<Assessment>[] = [
  {
    accessorKey: 'reference',
    header: 'Reference',
    cell: ({ row }) => (
      <Link
        href={`/portal/assessments/${row.original.id}`}
        className="font-mono text-xs font-medium hover:text-primary transition-colors"
      >
        {row.original.reference}
      </Link>
    ),
  },
  {
    accessorKey: 'projectName',
    header: 'Project',
    cell: ({ row }) => row.original.projectName ?? row.original.clientName,
  },
  {
    accessorKey: 'miningLocation',
    header: 'Site',
    cell: ({ row }) => row.original.miningLocation ?? '—',
  },
  {
    accessorKey: 'mineralType',
    header: 'Mineral',
    cell: ({ row }) =>
      row.original.mineralType
        ? row.original.mineralType.charAt(0) +
          row.original.mineralType.slice(1).toLowerCase()
        : '—',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'createdAt',
    header: 'Submitted',
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];

export function PortalAssessmentsList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useAssessments(orgId);
  const assessments = (data?.data ?? []) as Assessment[];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Technical Assessments"
        description="Plant and site assessments submitted for your organization, with engineering review status."
      />
      {assessments.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="No assessments yet"
          description="Submitted plant and site assessments will appear here once created by the Green Ngoria team."
        />
      ) : (
        <DataTable
          columns={columns}
          data={assessments}
          searchColumn="reference"
          searchPlaceholder="Search assessments…"
        />
      )}
    </div>
  );
}
