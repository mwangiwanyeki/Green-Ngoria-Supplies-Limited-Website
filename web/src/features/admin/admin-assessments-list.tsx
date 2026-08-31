'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { ClipboardCheck } from 'lucide-react';
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
import { useAssessments } from '@/lib/api/hooks/use-assessments';
import { formatRelativeDate } from '@/lib/utils';

interface AssessmentRow {
  id: string;
  reference: string;
  clientName: string;
  projectName: string | null;
  miningLocation: string | null;
  status: string;
  createdAt: string;
  assignedEngineer?: { firstName: string; lastName: string } | null;
}

const columns: ColumnDef<AssessmentRow>[] = [
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
    accessorKey: 'clientName',
    header: 'Client',
    cell: ({ row }) => (
      <Link
        href={`/admin/assessments/${row.original.id}`}
        className="font-medium hover:text-primary transition-colors"
      >
        {row.original.clientName}
      </Link>
    ),
  },
  {
    accessorKey: 'projectName',
    header: 'Project',
    cell: ({ row }) => row.original.projectName ?? '—',
  },
  {
    accessorKey: 'miningLocation',
    header: 'Site',
    cell: ({ row }) => row.original.miningLocation ?? '—',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'engineer',
    header: 'Engineer',
    cell: ({ row }) =>
      row.original.assignedEngineer
        ? `${row.original.assignedEngineer.firstName} ${row.original.assignedEngineer.lastName}`
        : '—',
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => formatRelativeDate(row.original.createdAt),
  },
];

export function AdminAssessmentsList() {
  const [page, setPage] = useState(1);
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useAssessments(orgId, {
    page,
    limit: 20,
  });

  const assessments = (data?.data as AssessmentRow[] | undefined) ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Plant Assessments"
        description="Multi-stage technical assessments from project and site context through reviewed findings."
      />
      {assessments.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-6 w-6" />}
          title="No assessments yet"
          description="Technical plant assessments will appear here as they are drafted and reviewed."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={assessments}
            searchColumn="clientName"
            searchPlaceholder="Search assessments…"
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
              disabled={assessments.length < 20}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
