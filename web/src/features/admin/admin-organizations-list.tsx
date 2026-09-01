'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Building2,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Users,
  Globe,
  Mail,
  Phone,
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
import { Input, Textarea, Label } from '@/components/ui/input';
import {
  useOrganizations,
  useCreateOrganization,
  useUpdateOrganization,
} from '@/lib/api/hooks/use-organizations';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { compact } from '@/lib/api/payload';
import { formatRelativeDate } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface Organization {
  id: string;
  name: string;
  slug?: string;
  type: string | null;
  country: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  website?: string | null;
  address?: string | null;
  taxPin?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { members: number; projects: number };
}

/** Matches `OrganizationType` in prisma/schema.prisma. */
const ORG_TYPES = ['INTERNAL', 'CLIENT', 'VENDOR', 'PARTNER'] as const;

const selectClass =
  'h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/**
 * Mirrors `CreateOrganizationDto` — only `name` is `@IsNotEmpty()`. `website`
 * is `@IsUrl()`, so it must be a real URL or omitted entirely.
 */
const orgSchema = z.object({
  name: z.string().trim().min(2, 'Organization name is required').max(255),
  type: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().max(30, 'Phone number is too long').optional(),
  website: z
    .string()
    .trim()
    .url('Enter a full URL, e.g. https://example.com')
    .optional()
    .or(z.literal('')),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  taxPin: z.string().optional(),
  description: z.string().optional(),
});

type OrgFormValues = z.infer<typeof orgSchema>;

const EMPTY_ORG: OrgFormValues = {
  name: '',
  type: 'CLIENT',
  email: '',
  phone: '',
  website: '',
  country: 'Kenya',
  city: '',
  address: '',
  taxPin: '',
  description: '',
};

interface RowHandlers {
  onEdit: (org: Organization) => void;
}

function RowActions({
  org,
  handlers,
}: {
  org: Organization;
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
          <DropdownMenu.Item asChild>
            <Link
              href={`/admin/organizations/${org.id}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            >
              <Eye className="h-3.5 w-3.5" /> View
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onEdit(org)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit details
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function buildColumns(handlers: RowHandlers): ColumnDef<Organization>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Organization',
      cell: ({ row }) => (
        <Link
          href={`/admin/organizations/${row.original.id}`}
          className="font-medium hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) =>
        row.original.type ? (
          <Badge variant="outline" className="text-xs">
            {row.original.type}
          </Badge>
        ) : (
          '—'
        ),
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
      header: 'Contact',
      cell: ({ row }) => (
        <div className="flex flex-col text-xs">
          <span>{row.original.email ?? '—'}</span>
          <span className="text-muted-foreground">
            {row.original.phone ?? ''}
          </span>
        </div>
      ),
    },
    {
      id: 'members',
      header: 'Members',
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5 text-xs">
          <Users className="h-3 w-3 text-muted-foreground" />
          {row.original._count?.members ?? 0}
        </span>
      ),
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
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <RowActions org={row.original} handlers={handlers} />,
    },
  ];
}

export function AdminOrganizationsList() {
  const { data, isLoading, isError, refetch } = useOrganizations<Organization>({
    limit: 100,
  });
  const orgs = data?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);

  const createOrg = useCreateOrganization();
  const updateOrg = useUpdateOrganization(editing?.id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: EMPTY_ORG,
  });

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_ORG);
    setDialogOpen(true);
  };

  const handleExport = () => {
    if (!orgs.length) { toast.error('No data to export'); return; }
    const headers = ['Name', 'Type', 'Country', 'City', 'Email', 'Phone', 'Members', 'Projects', 'Status', 'Created'];
    const csv = [headers.join(','), ...orgs.map((o) => [
      o.name, o.type ?? '', o.country ?? '', o.city ?? '',
      o.email ?? '', o.phone ?? '',
      o._count?.members ?? 0, o._count?.projects ?? 0,
      o.isActive ? 'Active' : 'Inactive',
      formatRelativeDate(o.createdAt),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `organizations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Export ready');
  };

  const openEdit = (org: Organization) => {
    setEditing(org);
    reset({
      name: org.name ?? '',
      type: org.type ?? 'CLIENT',
      email: org.email ?? '',
      phone: org.phone ?? '',
      website: org.website ?? '',
      country: org.country ?? 'Kenya',
      city: org.city ?? '',
      address: org.address ?? '',
      taxPin: org.taxPin ?? '',
      description: org.description ?? '',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: OrgFormValues) => {
    const payload = compact({
      name: values.name.trim(),
      type: values.type,
      email: values.email,
      phone: values.phone,
      website: values.website,
      country: values.country,
      city: values.city,
      address: values.address,
      taxPin: values.taxPin,
      description: values.description,
    });
    try {
      if (editing) {
        await updateOrg.mutateAsync(payload);
        toast.success('Organization updated', { description: values.name });
      } else {
        await createOrg.mutateAsync(payload);
        toast.success('Organization created', { description: values.name });
      }
      setDialogOpen(false);
      setEditing(null);
      reset(EMPTY_ORG);
    } catch (error) {
      toast.error(
        editing
          ? 'Could not update organization'
          : 'Could not create organization',
        { description: getApiErrorMessage(error) },
      );
    }
  };

  const columns = useMemo(
    () => buildColumns({ onEdit: openEdit }),
    // openEdit only closes over stable setters and `reset`.
    [],
  );

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  const saving = createOrg.isPending || updateOrg.isPending;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Organizations"
        description="Client organization accounts, membership, portal access and linked commercial and project records."
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button
              size="sm"
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              New Organization
            </Button>
          </div>
        }
      />

      {/* KPI strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          { label: 'Total Organizations', value: orgs.length },
          { label: 'Active', value: orgs.filter((o) => o.isActive).length },
          {
            label: 'Total Members',
            value: orgs.reduce((s, o) => s + (o._count?.members ?? 0), 0),
          },
          {
            label: 'With Projects',
            value: orgs.filter((o) => (o._count?.projects ?? 0) > 0).length,
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

      {orgs.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No organizations yet"
          description="Organizations appear here once registered."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              New Organization
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={orgs}
          searchColumn="name"
          searchPlaceholder="Search organizations…"
        />
      )}

      {/* Create / Edit Organization Dialog */}
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
              {editing ? 'Edit Organization' : 'New Organization'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the registered details for this organization.'
                : 'Register a client, vendor or partner organization account.'}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
          >
            <div className="grid gap-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="org-name">Organization name *</Label>
                <Input
                  id="org-name"
                  placeholder="Acacia Mining Ltd"
                  {...register('name')}
                  error={errors.name?.message}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-type">Type</Label>
                <select
                  id="org-type"
                  className={selectClass}
                  {...register('type')}
                >
                  {ORG_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="org-city">City</Label>
                  <Input
                    id="org-city"
                    placeholder="Nairobi"
                    {...register('city')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org-country">Country</Label>
                  <Input
                    id="org-country"
                    placeholder="Kenya"
                    {...register('country')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="org-email">Email</Label>
                  <Input
                    id="org-email"
                    type="email"
                    placeholder="info@example.com"
                    leftIcon={<Mail className="h-4 w-4" />}
                    {...register('email')}
                    error={errors.email?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org-phone">Phone</Label>
                  <Input
                    id="org-phone"
                    placeholder="+254 700 000 000"
                    leftIcon={<Phone className="h-4 w-4" />}
                    {...register('phone')}
                    error={errors.phone?.message}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-website">Website</Label>
                <Input
                  id="org-website"
                  placeholder="https://example.com"
                  leftIcon={<Globe className="h-4 w-4" />}
                  {...register('website')}
                  error={errors.website?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="org-address">Address</Label>
                  <Input
                    id="org-address"
                    placeholder="Westlands, Nairobi"
                    {...register('address')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org-taxpin">Tax PIN</Label>
                  <Input
                    id="org-taxpin"
                    placeholder="P051234567X"
                    {...register('taxPin')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-description">Description</Label>
                <Textarea
                  id="org-description"
                  rows={3}
                  className="min-h-[80px]"
                  placeholder="Operating profile, relationship context…"
                  {...register('description')}
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
                {editing ? 'Save Changes' : 'Create Organization'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
