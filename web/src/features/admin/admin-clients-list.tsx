'use client';

import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { Building2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/ui/page-header';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useClients } from '@/lib/api/hooks/use-clients';
import { formatRelativeDate } from '@/lib/utils';

interface ClientContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  isPrimary: boolean;
}

interface Client {
  id: string;
  clientNumber: string;
  companyName: string;
  industry?: string | null;
  country?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  contacts?: ClientContact[];
  _count?: { projects: number; quotations: number };
}

const columns: ColumnDef<Client>[] = [
  {
    accessorKey: 'clientNumber',
    header: 'Client #',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.clientNumber}
      </span>
    ),
  },
  {
    accessorKey: 'companyName',
    header: 'Company',
    cell: ({ row }) => (
      <Link
        href={`/admin/clients/${row.original.id}`}
        className="font-medium hover:text-primary transition-colors"
      >
        {row.original.companyName}
      </Link>
    ),
  },
  {
    accessorKey: 'industry',
    header: 'Industry',
    cell: ({ row }) => row.original.industry ?? '—',
  },
  {
    id: 'location',
    header: 'Location',
    cell: ({ row }) => {
      const parts = [row.original.city, row.original.country].filter(Boolean);
      return parts.length ? parts.join(', ') : '—';
    },
  },
  {
    id: 'contact',
    header: 'Primary Contact',
    cell: ({ row }) => {
      const primary =
        row.original.contacts?.find((c) => c.isPrimary) ??
        row.original.contacts?.[0];
      if (!primary) return '—';
      return (
        <div className="flex flex-col">
          <span className="text-xs font-medium">
            {primary.firstName} {primary.lastName}
          </span>
          {primary.email && (
            <span className="text-xs text-muted-foreground">
              {primary.email}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: 'projects',
    header: 'Projects',
    cell: ({ row }) => row.original._count?.projects ?? 0,
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'success' : 'mineral'}>
        {row.original.isActive ? 'Active' : 'Archived'}
      </Badge>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => formatRelativeDate(row.original.createdAt),
  },
];

export function AdminClientsList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useClients<Client>(orgId);
  const clients = data?.data ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Clients & Organizations"
        description="Organization-scoped client accounts, contacts, mining interests and linked commercial records."
      />
      {clients.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No clients yet"
          description="Client accounts appear here once created through the CRM or project workflow."
        />
      ) : (
        <DataTable
          columns={columns}
          data={clients}
          searchColumn="companyName"
          searchPlaceholder="Search clients…"
        />
      )}
    </div>
  );
}
