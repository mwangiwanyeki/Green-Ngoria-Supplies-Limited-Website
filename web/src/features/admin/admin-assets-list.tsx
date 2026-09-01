'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Boxes, Plus, MoreHorizontal, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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
import {
  useAssets,
  useCreateAsset,
  useCreateWorkOrder,
} from '@/lib/api/hooks/use-assets';
import { formatDate } from '@/lib/utils';
import {
  FormDialog,
  TextField,
  TextAreaField,
  SelectField,
  apiErrorMessage,
  buildPayload,
  optionalDate,
  enumOptions,
  rowMenuContentClass,
  rowMenuItemClass,
} from './_form-kit';

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

/** Mirrors the AssetStatus enum in prisma/schema.prisma. */
const ASSET_STATUSES = [
  'OPERATIONAL',
  'STANDBY',
  'UNDER_MAINTENANCE',
  'DECOMMISSIONED',
  'DISPOSED',
] as const;

/** Mirrors the MaintenanceType enum in prisma/schema.prisma. */
const MAINTENANCE_TYPES = [
  'PREVENTIVE',
  'CORRECTIVE',
  'EMERGENCY',
  'PREDICTIVE',
  'SHUTDOWN',
] as const;

// ─── Register asset dialog ─────────────────────────────────────────────────

interface AssetForm {
  name: string;
  assetNumber: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  category: string;
  location: string;
  installationDate: string;
  status: string;
  condition: string;
  warrantyExpiry: string;
  notes: string;
}

const EMPTY_ASSET: AssetForm = {
  name: '',
  assetNumber: '',
  serialNumber: '',
  manufacturer: '',
  model: '',
  category: '',
  location: '',
  installationDate: '',
  status: 'OPERATIONAL',
  condition: '',
  warrantyExpiry: '',
  notes: '',
};

/** Client-side mirror of CreateAssetDto's @IsNotEmpty fields. */
function validateAsset(form: AssetForm): Partial<Record<keyof AssetForm, string>> {
  const errors: Partial<Record<keyof AssetForm, string>> = {};
  if (!form.name.trim()) errors.name = 'Name is required.';
  if (!form.assetNumber.trim())
    errors.assetNumber = 'Asset number is required.';
  return errors;
}

function RegisterAssetDialog({
  open,
  onOpenChange,
  orgId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}) {
  const [form, setForm] = useState<AssetForm>(EMPTY_ASSET);
  const [errors, setErrors] = useState<Partial<Record<keyof AssetForm, string>>>(
    {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createAsset = useCreateAsset(orgId);

  const set = <K extends keyof AssetForm>(key: K, value: AssetForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setForm(EMPTY_ASSET);
      setErrors({});
      setSubmitError(null);
    }
  };

  const handleSubmit = () => {
    const found = validateAsset(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitError(null);

    createAsset.mutate(
      buildPayload({
        name: form.name,
        assetNumber: form.assetNumber,
        serialNumber: form.serialNumber,
        manufacturer: form.manufacturer,
        model: form.model,
        category: form.category,
        location: form.location,
        installationDate: optionalDate(form.installationDate),
        status: form.status,
        condition: form.condition,
        warrantyExpiry: optionalDate(form.warrantyExpiry),
        notes: form.notes,
      }),
      {
        onSuccess: () => {
          toast.success('Asset registered');
          close(false);
        },
        onError: (err) => setSubmitError(apiErrorMessage(err)),
      },
    );
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title="Register a plant asset"
      description="Record the installed item's identity and location. Maintenance history accrues against it from here."
      submitLabel="Register asset"
      onSubmit={handleSubmit}
      pending={createAsset.isPending}
      error={submitError}
      className="sm:max-w-2xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Asset number"
          required
          value={form.assetNumber}
          error={errors.assetNumber}
          placeholder="GNG-AST-0142"
          onChange={(v) => set('assetNumber', v)}
        />
        <TextField
          label="Name"
          required
          value={form.name}
          error={errors.name}
          placeholder="Ball Mill No. 2"
          onChange={(v) => set('name', v)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Serial number"
          value={form.serialNumber}
          onChange={(v) => set('serialNumber', v)}
        />
        <TextField
          label="Category"
          value={form.category}
          placeholder="Comminution"
          onChange={(v) => set('category', v)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Manufacturer"
          value={form.manufacturer}
          onChange={(v) => set('manufacturer', v)}
        />
        <TextField
          label="Model"
          value={form.model}
          onChange={(v) => set('model', v)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Location"
          value={form.location}
          placeholder="Milling bay, Line 1"
          onChange={(v) => set('location', v)}
        />
        <SelectField
          label="Status"
          value={form.status}
          options={enumOptions(ASSET_STATUSES)}
          onChange={(v) => set('status', v)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Installation date"
          type="date"
          value={form.installationDate}
          onChange={(v) => set('installationDate', v)}
        />
        <TextField
          label="Warranty expiry"
          type="date"
          value={form.warrantyExpiry}
          onChange={(v) => set('warrantyExpiry', v)}
        />
      </div>
      <TextField
        label="Condition"
        value={form.condition}
        placeholder="Good — liners replaced 03/2026"
        onChange={(v) => set('condition', v)}
      />
      <TextAreaField
        label="Notes"
        value={form.notes}
        rows={3}
        onChange={(v) => set('notes', v)}
      />
    </FormDialog>
  );
}

// ─── Work order dialog ─────────────────────────────────────────────────────

interface WorkOrderForm {
  type: string;
  title: string;
  description: string;
  scheduledDate: string;
}

const EMPTY_WORK_ORDER: WorkOrderForm = {
  type: 'PREVENTIVE',
  title: '',
  description: '',
  scheduledDate: '',
};

function WorkOrderDialog({
  asset,
  onOpenChange,
  orgId,
}: {
  asset: Asset | null;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}) {
  const [form, setForm] = useState<WorkOrderForm>(EMPTY_WORK_ORDER);
  const [errors, setErrors] = useState<
    Partial<Record<keyof WorkOrderForm, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createWorkOrder = useCreateWorkOrder(orgId);

  const set = <K extends keyof WorkOrderForm>(
    key: K,
    value: WorkOrderForm[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setForm(EMPTY_WORK_ORDER);
      setErrors({});
      setSubmitError(null);
    }
  };

  const handleSubmit = () => {
    if (!asset) return;
    // Mirrors CreateWorkOrderDto's @IsNotEmpty fields.
    const found: Partial<Record<keyof WorkOrderForm, string>> = {};
    if (!form.title.trim()) found.title = 'Title is required.';
    if (!form.description.trim())
      found.description = 'Description is required.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitError(null);

    createWorkOrder.mutate(
      buildPayload({
        assetId: asset.id,
        type: form.type,
        title: form.title,
        description: form.description,
        scheduledDate: optionalDate(form.scheduledDate),
      }),
      {
        onSuccess: () => {
          toast.success('Work order created');
          close(false);
        },
        onError: (err) => setSubmitError(apiErrorMessage(err)),
      },
    );
  };

  return (
    <FormDialog
      open={asset !== null}
      onOpenChange={close}
      title="Log a maintenance work order"
      description={
        asset
          ? `Raised against ${asset.assetNumber} — ${asset.name}.`
          : undefined
      }
      submitLabel="Create work order"
      onSubmit={handleSubmit}
      pending={createWorkOrder.isPending}
      error={submitError}
    >
      <SelectField
        label="Maintenance type"
        required
        value={form.type}
        options={enumOptions(MAINTENANCE_TYPES)}
        onChange={(v) => set('type', v)}
      />
      <TextField
        label="Title"
        required
        value={form.title}
        error={errors.title}
        placeholder="Replace mill liner segment 4"
        onChange={(v) => set('title', v)}
      />
      <TextAreaField
        label="Description"
        required
        value={form.description}
        error={errors.description}
        placeholder="Scope of work, parts required, isolation requirements…"
        onChange={(v) => set('description', v)}
      />
      <TextField
        label="Scheduled date"
        type="date"
        value={form.scheduledDate}
        onChange={(v) => set('scheduledDate', v)}
      />
    </FormDialog>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function AdminAssetsList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useAssets<Asset>(orgId);
  const assets = data?.data ?? [];

  const [registerOpen, setRegisterOpen] = useState(false);
  const [workOrderFor, setWorkOrderFor] = useState<Asset | null>(null);

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
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
              aria-label={`Actions for ${row.original.name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className={rowMenuContentClass}
            >
              <DropdownMenu.Item
                className={rowMenuItemClass}
                onSelect={() => setWorkOrderFor(row.original)}
              >
                <ClipboardList className="h-3.5 w-3.5" /> Log work order
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ),
    },
  ];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Asset Register"
        description="Installed plant and equipment identity, location, commissioning and service history."
        actions={
          <Button
            size="sm"
            variant="brand"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setRegisterOpen(true)}
          >
            Register Asset
          </Button>
        }
      />
      {assets.length === 0 ? (
        <EmptyState
          icon={<Boxes className="h-6 w-6" />}
          title="No assets registered"
          description="Assets appear here once registered at project handover."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setRegisterOpen(true)}
            >
              Register Asset
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={assets}
          searchColumn="name"
          searchPlaceholder="Search assets…"
        />
      )}

      <RegisterAssetDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        orgId={orgId}
      />
      <WorkOrderDialog
        asset={workOrderFor}
        onOpenChange={(open) => {
          if (!open) setWorkOrderFor(null);
        }}
        orgId={orgId}
      />
    </div>
  );
}
