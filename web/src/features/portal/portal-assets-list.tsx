'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Cpu } from 'lucide-react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useAssets } from '@/lib/api/hooks/use-assets';
import { formatDate } from '@/lib/utils';

interface Asset {
  id: string;
  assetNumber: string;
  name: string;
  category: string | null;
  location: string | null;
  status: string;
  condition: string | null;
  warrantyExpiry: string | null;
}

const columns: ColumnDef<Asset>[] = [
  {
    accessorKey: 'assetNumber',
    header: 'Asset #',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.assetNumber}</span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Asset',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => row.original.category ?? '—',
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => row.original.location ?? '—',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'warrantyExpiry',
    header: 'Warranty Expiry',
    cell: ({ row }) => formatDate(row.original.warrantyExpiry),
  },
];

export function PortalAssetsList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useAssets(orgId);
  const assets = (data?.data ?? []) as Asset[];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Plant Assets"
        description="Handed-over equipment, warranty context and installation location for your authorized projects."
      />
      {assets.length === 0 ? (
        <EmptyState
          icon={<Cpu className="h-6 w-6" />}
          title="No assets yet"
          description="Plant assets will appear here once equipment is handed over on a completed project."
        />
      ) : (
        <DataTable
          columns={columns}
          data={assets}
          searchColumn="name"
          searchPlaceholder="Search assets…"
        />
      )}
    </div>
  );
}
