'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Wrench } from 'lucide-react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useEquipment } from '@/lib/api/hooks/use-equipment';
import { formatRelativeDate } from '@/lib/utils';

interface EquipmentRow {
  id: string;
  sku: string;
  name: string;
  manufacturer: string | null;
  application: string | null;
  capacity: string | null;
  isAvailable: boolean;
  isPublished: boolean;
  createdAt: string;
  category?: { name: string } | null;
}

const columns: ColumnDef<EquipmentRow>[] = [
  {
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.sku}
      </span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Equipment',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    id: 'category',
    header: 'Category',
    cell: ({ row }) => row.original.category?.name ?? '—',
  },
  {
    accessorKey: 'application',
    header: 'Application',
    cell: ({ row }) => row.original.application ?? '—',
  },
  {
    accessorKey: 'capacity',
    header: 'Capacity',
    cell: ({ row }) => row.original.capacity ?? '—',
  },
  {
    id: 'availability',
    header: 'Availability',
    cell: ({ row }) => (
      <Badge variant={row.original.isAvailable ? 'success' : 'mineral'}>
        {row.original.isAvailable ? 'Available' : 'Unavailable'}
      </Badge>
    ),
  },
  {
    id: 'published',
    header: 'Publication',
    cell: ({ row }) => (
      <Badge variant={row.original.isPublished ? 'brand' : 'mineral'}>
        {row.original.isPublished ? 'Published' : 'Draft'}
      </Badge>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Added',
    cell: ({ row }) => formatRelativeDate(row.original.createdAt),
  },
];

export function AdminEquipmentList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useEquipment(
    { page, limit: 20 },
    true,
  );

  const equipment = (data?.data as EquipmentRow[] | undefined) ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Equipment Catalogue"
        description="Technical equipment records with applications, specifications and publication state."
      />
      {equipment.length === 0 ? (
        <EmptyState
          icon={<Wrench className="h-6 w-6" />}
          title="No equipment records yet"
          description="Equipment items will appear here once added to the catalogue."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={equipment}
            searchColumn="name"
            searchPlaceholder="Search equipment…"
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
              disabled={equipment.length < 20}
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
