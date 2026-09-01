'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Truck,
  Plus,
  Download,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Phone,
  Mail,
  Globe,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input, Textarea, Label } from '@/components/ui/input';
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useVendors,
  useCreateVendor,
  useUpdateVendor,
  useApproveVendor,
} from '@/lib/api/hooks/use-procurement';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { compact, toStringArray } from '@/lib/api/payload';
import { formatRelativeDate } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface Vendor {
  id: string;
  name: string;
  contactName: string | null;
  category: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  address: string | null;
  taxPin: string | null;
  website: string | null;
  specializations: string[];
  isApproved: boolean;
  approvedAt: string | null;
  notes: string | null;
  createdAt: string;
  _count?: { quotes: number; purchaseOrders: number };
}

/**
 * Mirrors `CreateVendorDto` — only `name` is `@IsNotEmpty()`. `email` is
 * `@IsEmail()` and `website` is `@IsUrl()`, so both must be valid or omitted.
 * The DTO exposes no `category`, so supply focus is captured through
 * `specializations`.
 */
const vendorSchema = z.object({
  name: z.string().trim().min(2, 'Vendor name is required').max(255),
  contactName: z.string().optional(),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string().max(30, 'Phone number is too long').optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  taxPin: z.string().optional(),
  website: z
    .string()
    .trim()
    .url('Enter a full URL, e.g. https://example.com')
    .optional()
    .or(z.literal('')),
  specializations: z.string().optional(),
  notes: z.string().optional(),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

const EMPTY_VENDOR: VendorFormValues = {
  name: '',
  contactName: '',
  email: '',
  phone: '',
  country: 'Kenya',
  address: '',
  taxPin: '',
  website: '',
  specializations: '',
  notes: '',
};

interface RowHandlers {
  onEdit: (vendor: Vendor) => void;
  onApprove: (vendor: Vendor) => void;
}

function RowActions({
  vendor,
  handlers,
}: {
  vendor: Vendor;
  handlers: RowHandlers;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Row actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[170px] rounded-xl border border-border bg-card p-1 shadow-xl"
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onEdit(vendor)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit vendor
          </DropdownMenu.Item>
          {!vendor.isApproved && (
            <DropdownMenu.Item
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-emerald-600 outline-none cursor-pointer hover:bg-emerald-500/10"
              onSelect={() => handlers.onApprove(vendor)}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Approve vendor
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function buildColumns(handlers: RowHandlers): ColumnDef<Vendor>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Vendor Name',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'specializations',
      header: 'Specializations',
      cell: ({ row }) =>
        row.original.specializations?.length ? (
          <div className="flex flex-wrap gap-1">
            {row.original.specializations.slice(0, 2).map((spec) => (
              <Badge key={spec} variant="outline" className="text-[10px]">
                {spec}
              </Badge>
            ))}
            {row.original.specializations.length > 2 && (
              <Badge variant="mineral" className="text-[10px]">
                +{row.original.specializations.length - 2}
              </Badge>
            )}
          </div>
        ) : (
          (row.original.category ?? '—')
        ),
    },
    {
      id: 'contact',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium">{row.original.contactName ?? '—'}</span>
          <span className="text-muted-foreground">
            {row.original.email ?? row.original.phone ?? ''}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'country',
      header: 'Country',
      cell: ({ row }) => row.original.country ?? '—',
    },
    {
      accessorKey: 'isApproved',
      header: 'Qualification',
      cell: ({ row }) => (
        <Badge variant={row.original.isApproved ? 'success' : 'warning'}>
          {row.original.isApproved ? 'Approved' : 'Pending'}
        </Badge>
      ),
    },
    {
      id: 'quotes',
      header: 'Quotes',
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums">
          {row.original._count?.quotes ?? 0}
        </span>
      ),
    },
    {
      id: 'purchaseOrders',
      header: 'Orders',
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums">
          {row.original._count?.purchaseOrders ?? 0}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Registered',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <RowActions vendor={row.original} handlers={handlers} />
      ),
    },
  ];
}

export function AdminVendorsList() {
  const { data: me } = useMe();
  const orgId = me?.organizationId ?? '';

  const { data, isLoading, isError, refetch } = useVendors(orgId);
  const items = (data?.data ?? []) as unknown as Vendor[];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [approving, setApproving] = useState<Vendor | null>(null);

  const createVendor = useCreateVendor(orgId);
  const updateVendor = useUpdateVendor(orgId, editing?.id ?? '');
  const approveVendor = useApproveVendor(orgId, approving?.id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: EMPTY_VENDOR,
  });

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_VENDOR);
    setDialogOpen(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditing(vendor);
    reset({
      name: vendor.name ?? '',
      contactName: vendor.contactName ?? '',
      email: vendor.email ?? '',
      phone: vendor.phone ?? '',
      country: vendor.country ?? 'Kenya',
      address: vendor.address ?? '',
      taxPin: vendor.taxPin ?? '',
      website: vendor.website ?? '',
      specializations: (vendor.specializations ?? []).join(', '),
      notes: vendor.notes ?? '',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: VendorFormValues) => {
    // `PATCH .../vendors/:vendorId` binds the full CreateVendorDto, so `name`
    // always travels with the payload.
    const payload = compact({
      name: values.name.trim(),
      contactName: values.contactName,
      email: values.email,
      phone: values.phone,
      country: values.country,
      address: values.address,
      taxPin: values.taxPin,
      website: values.website,
      specializations: toStringArray(values.specializations),
      notes: values.notes,
    });
    try {
      if (editing) {
        await updateVendor.mutateAsync(payload);
        toast.success('Vendor updated', { description: values.name });
      } else {
        await createVendor.mutateAsync(payload);
        toast.success('Vendor registered', { description: values.name });
      }
      setDialogOpen(false);
      setEditing(null);
      reset(EMPTY_VENDOR);
    } catch (error) {
      toast.error(
        editing ? 'Could not update vendor' : 'Could not register vendor',
        { description: getApiErrorMessage(error) },
      );
    }
  };

  const confirmApprove = async () => {
    if (!approving) return;
    try {
      await approveVendor.mutateAsync();
      toast.success('Vendor approved', { description: approving.name });
      setApproving(null);
    } catch (error) {
      toast.error('Could not approve vendor', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const columns = useMemo(
    () => buildColumns({ onEdit: openEdit, onApprove: setApproving }),
    // openEdit only closes over stable setters and `reset`.
    [],
  );

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  const saving = createVendor.isPending || updateVendor.isPending;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Vendor & Supplier Qualification"
        description="Supplier qualification, capabilities, compliance status and sourcing history."
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
            >
              Export
            </Button>
            <Button
              size="sm"
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Register Vendor
            </Button>
          </div>
        }
      />

      {/* KPI stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          { label: 'Registered Vendors', value: items.length },
          {
            label: 'Approved',
            value: items.filter((v) => v.isApproved).length,
          },
          {
            label: 'Pending Approval',
            value: items.filter((v) => !v.isApproved).length,
          },
          {
            label: 'Active Orders',
            value: items.reduce(
              (s, v) => s + (v._count?.purchaseOrders ?? 0),
              0,
            ),
          },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold mt-1">{kpi.value}</p>
          </div>
        ))}
      </motion.div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Truck className="h-6 w-6" />}
          title="No vendors registered"
          description="Register certified manufacturers, mill fabricators, reagent suppliers, and equipment vendors."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Register Vendor
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          searchColumn="name"
          searchPlaceholder="Search vendors by company name…"
        />
      )}

      {/* Create / Edit Vendor Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (saving) return;
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit Vendor' : 'Register New Vendor'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update this supplier’s contact and compliance details.'
                : 'Register a supplier before it can quote or receive purchase orders.'}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
          >
            <div className="grid gap-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="vendor-name">Vendor legal name *</Label>
                <Input
                  id="vendor-name"
                  placeholder="Weir Minerals Africa"
                  {...register('name')}
                  error={errors.name?.message}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vendor-specializations">Specializations</Label>
                <Input
                  id="vendor-specializations"
                  placeholder="CIP Equipment, Grinding Media, Reagents"
                  {...register('specializations')}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated. Each entry is stored as its own tag.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-contact">Contact person</Label>
                  <Input
                    id="vendor-contact"
                    placeholder="Grace Muthoni"
                    {...register('contactName')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-country">Country</Label>
                  <Input
                    id="vendor-country"
                    placeholder="Kenya"
                    {...register('country')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-email">Email</Label>
                  <Input
                    id="vendor-email"
                    type="email"
                    placeholder="sales@example.com"
                    leftIcon={<Mail className="h-4 w-4" />}
                    {...register('email')}
                    error={errors.email?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-phone">Phone</Label>
                  <Input
                    id="vendor-phone"
                    placeholder="+254 700 000 000"
                    leftIcon={<Phone className="h-4 w-4" />}
                    {...register('phone')}
                    error={errors.phone?.message}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vendor-website">Website</Label>
                <Input
                  id="vendor-website"
                  placeholder="https://example.com"
                  leftIcon={<Globe className="h-4 w-4" />}
                  {...register('website')}
                  error={errors.website?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-address">Address</Label>
                  <Input
                    id="vendor-address"
                    placeholder="Industrial Area, Nairobi"
                    {...register('address')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-taxpin">Tax PIN</Label>
                  <Input
                    id="vendor-taxpin"
                    placeholder="P051234567X"
                    {...register('taxPin')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vendor-notes">Compliance notes</Label>
                <Textarea
                  id="vendor-notes"
                  rows={3}
                  className="min-h-[80px]"
                  placeholder="ISO certification, credit terms, audit findings…"
                  {...register('notes')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setDialogOpen(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" loading={saving}>
                {editing ? 'Save Changes' : 'Register Vendor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!approving}
        onOpenChange={(open) => {
          if (!open) setApproving(null);
        }}
        title="Approve this vendor?"
        description={
          <>
            {approving?.name} will become eligible to submit quotes and receive
            purchase orders.
          </>
        }
        confirmLabel="Approve vendor"
        cancelLabel="Not yet"
        destructive={false}
        loading={approveVendor.isPending}
        onConfirm={() => void confirmApprove()}
      />
    </div>
  );
}
