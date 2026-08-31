'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { FileStack } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/ui/page-header';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useDocuments } from '@/lib/api/hooks/use-engineering';
import { formatRelativeDate } from '@/lib/utils';

interface EngineeringDocument {
  id: string;
  documentNumber: string;
  title: string;
  type: string;
  revision: string;
  status: string;
  createdAt: string;
  author?: { id: string; firstName: string; lastName: string } | null;
  project?: { id: string; projectNumber: string; name: string } | null;
}

const columns: ColumnDef<EngineeringDocument>[] = [
  {
    accessorKey: 'documentNumber',
    header: 'Doc #',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.documentNumber}
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
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="mineral" className="capitalize">
        {row.original.type.replace(/_/g, ' ').toLowerCase()}
      </Badge>
    ),
  },
  {
    accessorKey: 'revision',
    header: 'Revision',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.revision}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'author',
    header: 'Author',
    cell: ({ row }) =>
      row.original.author
        ? `${row.original.author.firstName} ${row.original.author.lastName}`
        : '—',
  },
  {
    accessorKey: 'createdAt',
    header: 'Uploaded',
    cell: ({ row }) => formatRelativeDate(row.original.createdAt),
  },
];

export function AdminEngineeringList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } =
    useDocuments<EngineeringDocument>(orgId);
  const documents = data?.data ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Engineering Document Control"
        description="Controlled drawings, specifications, datasheets, revisions, transmittals and approvals."
      />
      {documents.length === 0 ? (
        <EmptyState
          icon={<FileStack className="h-6 w-6" />}
          title="No documents yet"
          description="Controlled engineering documents appear here once uploaded."
        />
      ) : (
        <DataTable
          columns={columns}
          data={documents}
          searchColumn="title"
          searchPlaceholder="Search documents…"
        />
      )}
    </div>
  );
}
