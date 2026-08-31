'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { HardHat } from 'lucide-react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useHseIncidents } from '@/lib/api/hooks/use-hse';
import { formatDate, formatRelativeDate } from '@/lib/utils';

interface HseIncidentRow {
  id: string;
  title: string;
  severity: string;
  incidentDate: string;
  location: string | null;
  isReportable: boolean;
  closedAt: string | null;
  createdAt: string;
}

const SEVERITY_VARIANT: Record<string, 'warning' | 'destructive'> = {
  NEAR_MISS: 'warning',
  FIRST_AID: 'warning',
  MEDICAL_TREATMENT: 'destructive',
  LOST_TIME: 'destructive',
  FATALITY: 'destructive',
};

const columns: ColumnDef<HseIncidentRow>[] = [
  {
    accessorKey: 'title',
    header: 'Incident',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title}</span>
    ),
  },
  {
    accessorKey: 'severity',
    header: 'Severity',
    cell: ({ row }) => (
      <Badge variant={SEVERITY_VARIANT[row.original.severity] ?? 'outline'}>
        {row.original.severity.replace(/_/g, ' ').toLowerCase()}
      </Badge>
    ),
  },
  {
    accessorKey: 'incidentDate',
    header: 'Date',
    cell: ({ row }) => formatDate(row.original.incidentDate),
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => row.original.location ?? '—',
  },
  {
    id: 'reportable',
    header: 'Reportable',
    cell: ({ row }) =>
      row.original.isReportable ? (
        <Badge variant="destructive">Reportable</Badge>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) =>
      row.original.closedAt ? (
        <Badge variant="mineral">Closed</Badge>
      ) : (
        <Badge variant="brand">Open</Badge>
      ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Reported',
    cell: ({ row }) => formatRelativeDate(row.original.createdAt),
  },
];

export function AdminHseList() {
  const [page, setPage] = useState(1);
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useHseIncidents(orgId, {
    page,
    limit: 20,
  });

  const incidents = (data?.data as HseIncidentRow[] | undefined) ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="HSE Management"
        description="Site observations, incidents, corrective actions and auditable closure."
      />
      {incidents.length === 0 ? (
        <EmptyState
          icon={<HardHat className="h-6 w-6" />}
          title="No HSE incidents recorded"
          description="Reported incidents and observations will appear here for triage and closure."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={incidents}
            searchColumn="title"
            searchPlaceholder="Search incidents…"
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
              disabled={incidents.length < 20}
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
