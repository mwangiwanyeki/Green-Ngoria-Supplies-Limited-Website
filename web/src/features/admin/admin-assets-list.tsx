'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Boxes } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/ui/page-header';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useAssets } from '@/lib/api/hooks/use-assets';
import { formatDate } from '@/lib/utils';

interface Asset {
  id: string;
  assetNumber: string;
  name: string;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  category?: string | null;
  location?: string | null;
  status: string;
  condition?: string | null;
  installationDate?: string | null;
  warrantyExpiry?: string | null;
  project?: { id: string; projectNumber: string; name: string } | null;
}

const columns: ColumnDef<Asset>[] = [
  {
    accessorKey: 'assetNumber',
    header: 'Asset #',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.assetNumber}
      </span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        {row.original.serialNumber && (
          <span className="text-xs text-muted-foreground">
            S/N {row.original.serialNumber}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => row.original.category ?? '—',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => row.original.location ?? '—',
  },
  {
    id: 'project',
    header: 'Project',
    cell: ({ row }) => row.original.project?.name ?? '—',
  },
  {
    accessorKey: 'installationDate',
    header: 'Installed',
    cell: ({ row }) => formatDate(row.original.installationDate),
  },
];

export function AdminAssetsList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useAssets<Asset>(orgId);
  const assets = data?.data ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Asset Register"
        description="Installed plant and equipment identity, location, commissioning and service history."
      />
      {assets.length === 0 ? (
        <EmptyState
          icon={<Boxes className="h-6 w-6" />}
          title="No assets registered"
          description="Assets appear here once registered at project handover."
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
