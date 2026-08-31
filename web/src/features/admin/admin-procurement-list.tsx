'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { ClipboardList, Truck, Building2 } from 'lucide-react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useRequisitions,
  useVendors,
  usePurchaseOrders,
} from '@/lib/api/hooks/use-procurement';
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
  cn,
} from '@/lib/utils';

interface RequisitionRow {
  id: string;
  requisitionNo: string;
  title: string;
  urgency: string;
  status: string;
  totalEstimated: number | null;
  currency: string;
  requiredByDate: string | null;
  createdAt: string;
}

interface VendorRow {
  id: string;
  name: string;
  contactName: string | null;
  country: string | null;
  specializations: string[];
  isApproved: boolean;
  createdAt: string;
}

interface PurchaseOrderRow {
  id: string;
  poNumber?: string;
  status?: string;
  totalAmount: number;
  currency: string;
  expectedDelivery: string | null;
  createdAt: string;
  vendor?: { name: string } | null;
}

const requisitionColumns: ColumnDef<RequisitionRow>[] = [
  {
    accessorKey: 'requisitionNo',
    header: 'Req #',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.requisitionNo}
      </span>
    ),
  },
  { accessorKey: 'title', header: 'Title' },
  {
    accessorKey: 'urgency',
    header: 'Urgency',
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.urgency === 'EMERGENCY' ||
          row.original.urgency === 'URGENT'
            ? 'destructive'
            : 'outline'
        }
      >
        {row.original.urgency}
      </Badge>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'totalEstimated',
    header: 'Est. Value',
    cell: ({ row }) =>
      row.original.totalEstimated
        ? formatCurrency(row.original.totalEstimated, row.original.currency)
        : '—',
  },
  {
    accessorKey: 'requiredByDate',
    header: 'Required By',
    cell: ({ row }) => formatDate(row.original.requiredByDate),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => formatRelativeDate(row.original.createdAt),
  },
];

const vendorColumns: ColumnDef<VendorRow>[] = [
  {
    accessorKey: 'name',
    header: 'Vendor',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: 'contactName',
    header: 'Contact',
    cell: ({ row }) => row.original.contactName ?? '—',
  },
  {
    accessorKey: 'country',
    header: 'Country',
    cell: ({ row }) => row.original.country ?? '—',
  },
  {
    id: 'specializations',
    header: 'Specializations',
    cell: ({ row }) => row.original.specializations?.join(', ') || '—',
  },
  {
    id: 'approval',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.isApproved ? 'success' : 'warning'}>
        {row.original.isApproved ? 'Approved' : 'Pending'}
      </Badge>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Registered',
    cell: ({ row }) => formatRelativeDate(row.original.createdAt),
  },
];

const poColumns: ColumnDef<PurchaseOrderRow>[] = [
  {
    id: 'vendor',
    header: 'Vendor',
    cell: ({ row }) => row.original.vendor?.name ?? '—',
  },
  {
    accessorKey: 'totalAmount',
    header: 'Amount',
    cell: ({ row }) =>
      formatCurrency(row.original.totalAmount, row.original.currency),
  },
  {
    accessorKey: 'expectedDelivery',
    header: 'Expected Delivery',
    cell: ({ row }) => formatDate(row.original.expectedDelivery),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => formatRelativeDate(row.original.createdAt),
  },
];

type Tab = 'requisitions' | 'vendors' | 'purchase-orders';

export function AdminProcurementList() {
  const [tab, setTab] = useState<Tab>('requisitions');
  const [page, setPage] = useState(1);
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';

  const requisitionsQuery = useRequisitions(orgId, { page, limit: 20 });
  const vendorsQuery = useVendors(orgId, { page, limit: 20 });
  const poQuery = usePurchaseOrders(orgId, { page, limit: 20 });

  const requisitions =
    (requisitionsQuery.data?.data as RequisitionRow[] | undefined) ?? [];
  const vendors = (vendorsQuery.data?.data as VendorRow[] | undefined) ?? [];
  const purchaseOrders =
    (poQuery.data?.data as PurchaseOrderRow[] | undefined) ?? [];

  const active =
    tab === 'requisitions'
      ? requisitionsQuery
      : tab === 'vendors'
        ? vendorsQuery
        : poQuery;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Procurement"
        description="Requisitions, supplier vendors, comparisons and purchase orders."
      />
      <div className="flex gap-2 border-b border-border">
        {(
          [
            ['requisitions', 'Requisitions'],
            ['vendors', 'Vendors'],
            ['purchase-orders', 'Purchase Orders'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => {
              setTab(value);
              setPage(1);
            }}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === value
                ? 'border-brand-500 text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {active.isLoading ? (
        <PageSkeleton />
      ) : active.isError ? (
        <ErrorState retry={() => void active.refetch()} />
      ) : tab === 'requisitions' ? (
        requisitions.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title="No requisitions yet"
            description="Purchase requisitions raised for projects will appear here."
          />
        ) : (
          <DataTable
            columns={requisitionColumns}
            data={requisitions}
            searchColumn="title"
            searchPlaceholder="Search requisitions…"
          />
        )
      ) : tab === 'vendors' ? (
        vendors.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title="No vendors registered"
            description="Qualified suppliers will appear here once registered."
          />
        ) : (
          <DataTable
            columns={vendorColumns}
            data={vendors}
            searchColumn="name"
            searchPlaceholder="Search vendors…"
          />
        )
      ) : purchaseOrders.length === 0 ? (
        <EmptyState
          icon={<Truck className="h-6 w-6" />}
          title="No purchase orders yet"
          description="Purchase orders issued to vendors will appear here."
        />
      ) : (
        <DataTable columns={poColumns} data={purchaseOrders} />
      )}

      {!active.isLoading && !active.isError && (
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
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
