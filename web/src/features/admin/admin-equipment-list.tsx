'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Wrench,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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
  useEquipment,
  useEquipmentCategories,
  useCreateEquipment,
  useUpdateEquipmentById,
  useSetEquipmentPublished,
  useDeleteEquipment,
} from '@/lib/api/hooks/use-equipment';
import { formatRelativeDate } from '@/lib/utils';
import {
  FormDialog,
  TextField,
  TextAreaField,
  SelectField,
  CheckboxField,
  apiErrorMessage,
  buildPayload,
  optionalNumber,
  confirmAction,
  rowMenuContentClass,
  rowMenuItemClass,
  rowMenuDestructiveItemClass,
  type SelectOption,
} from './_form-kit';

interface EquipmentRow {
  id: string;
  sku: string;
  name: string;
  model: string | null;
  manufacturer: string | null;
  description: string | null;
  application: string | null;
  capacity: string | null;
  powerKw: number | null;
  weight: number | null;
  dimensions: string | null;
  leadTimeDays: number | null;
  isAvailable: boolean;
  isPublished: boolean;
  createdAt: string;
  categoryId?: string | null;
  category?: { name: string } | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

// ─── Form ──────────────────────────────────────────────────────────────────

interface EquipmentForm {
  sku: string;
  name: string;
  categoryId: string;
  model: string;
  manufacturer: string;
  description: string;
  application: string;
  capacity: string;
  powerKw: string;
  weight: string;
  dimensions: string;
  leadTimeDays: string;
  isAvailable: boolean;
  isPublished: boolean;
}

const EMPTY_FORM: EquipmentForm = {
  sku: '',
  name: '',
  categoryId: '',
  model: '',
  manufacturer: '',
  description: '',
  application: '',
  capacity: '',
  powerKw: '',
  weight: '',
  dimensions: '',
  leadTimeDays: '',
  isAvailable: true,
  isPublished: false,
};

function toForm(item: EquipmentRow): EquipmentForm {
  return {
    sku: item.sku ?? '',
    name: item.name ?? '',
    categoryId: item.categoryId ?? '',
    model: item.model ?? '',
    manufacturer: item.manufacturer ?? '',
    description: item.description ?? '',
    application: item.application ?? '',
    capacity: item.capacity ?? '',
    powerKw: item.powerKw != null ? String(item.powerKw) : '',
    weight: item.weight != null ? String(item.weight) : '',
    dimensions: item.dimensions ?? '',
    leadTimeDays: item.leadTimeDays != null ? String(item.leadTimeDays) : '',
    isAvailable: item.isAvailable ?? true,
    isPublished: item.isPublished ?? false,
  };
}

/** Client-side mirror of CreateEquipmentDto's @IsNotEmpty / @Min(0) rules. */
function validate(
  form: EquipmentForm,
): Partial<Record<keyof EquipmentForm, string>> {
  const errors: Partial<Record<keyof EquipmentForm, string>> = {};
  if (!form.sku.trim()) errors.sku = 'SKU is required.';
  if (!form.name.trim()) errors.name = 'Name is required.';
  for (const key of ['powerKw', 'weight', 'leadTimeDays'] as const) {
    const raw = form[key];
    if (raw.trim() === '') continue;
    const n = Number(raw);
    if (!Number.isFinite(n)) errors[key] = 'Must be a number.';
    else if (n < 0) errors[key] = 'Cannot be negative.';
  }
  return errors;
}

function EquipmentDialog({
  open,
  onOpenChange,
  editing,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: EquipmentRow | null;
  categories: CategoryOption[];
}) {
  const [form, setForm] = useState<EquipmentForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof EquipmentForm, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Re-seed the form whenever the dialog is opened for a different record.
  const [seededFor, setSeededFor] = useState<string | null>(null);

  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipmentById();
  const pending = createEquipment.isPending || updateEquipment.isPending;

  const seedKey = open ? (editing?.id ?? 'new') : null;
  if (seedKey !== seededFor) {
    setSeededFor(seedKey);
    setForm(editing ? toForm(editing) : EMPTY_FORM);
    setErrors({});
    setSubmitError(null);
  }

  const set = <K extends keyof EquipmentForm>(
    key: K,
    value: EquipmentForm[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const categoryOptions: SelectOption[] = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const handleSubmit = () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitError(null);

    // The PATCH route reuses CreateEquipmentDto, so edits send the full record.
    const payload = buildPayload({
      sku: form.sku,
      name: form.name,
      categoryId: form.categoryId,
      model: form.model,
      manufacturer: form.manufacturer,
      description: form.description,
      application: form.application,
      capacity: form.capacity,
      powerKw: optionalNumber(form.powerKw),
      weight: optionalNumber(form.weight),
      dimensions: form.dimensions,
      leadTimeDays: optionalNumber(form.leadTimeDays),
      isAvailable: form.isAvailable,
      isPublished: form.isPublished,
    });

    const handlers = {
      onSuccess: () => {
        toast.success(editing ? 'Equipment updated' : 'Equipment added');
        onOpenChange(false);
      },
      onError: (err: unknown) => setSubmitError(apiErrorMessage(err)),
    };

    if (editing) {
      updateEquipment.mutate({ id: editing.id, data: payload }, handlers);
    } else {
      createEquipment.mutate(payload, handlers);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit equipment' : 'Add equipment to catalogue'}
      description="SKU and name identify the item; the remaining technical fields are optional and can be filled in later."
      submitLabel={editing ? 'Save changes' : 'Add equipment'}
      onSubmit={handleSubmit}
      pending={pending}
      error={submitError}
      className="sm:max-w-2xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="SKU"
          required
          value={form.sku}
          error={errors.sku}
          placeholder="CIP-TANK-50"
          onChange={(v) => set('sku', v)}
        />
        <SelectField
          label="Category"
          value={form.categoryId}
          placeholder="Uncategorised"
          options={categoryOptions}
          onChange={(v) => set('categoryId', v)}
        />
      </div>
      <TextField
        label="Name"
        required
        value={form.name}
        error={errors.name}
        placeholder="Carbon-in-Pulp Adsorption Tank 50m³"
        onChange={(v) => set('name', v)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Manufacturer"
          value={form.manufacturer}
          placeholder="Metso Outotec"
          onChange={(v) => set('manufacturer', v)}
        />
        <TextField
          label="Model"
          value={form.model}
          onChange={(v) => set('model', v)}
        />
      </div>
      <TextAreaField
        label="Description"
        value={form.description}
        rows={3}
        onChange={(v) => set('description', v)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Application"
          value={form.application}
          placeholder="CIP/CIL gold processing"
          onChange={(v) => set('application', v)}
        />
        <TextField
          label="Capacity"
          value={form.capacity}
          placeholder="50 m³ / 120 t/h"
          onChange={(v) => set('capacity', v)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="Power (kW)"
          type="number"
          value={form.powerKw}
          error={errors.powerKw}
          onChange={(v) => set('powerKw', v)}
        />
        <TextField
          label="Weight (kg)"
          type="number"
          value={form.weight}
          error={errors.weight}
          onChange={(v) => set('weight', v)}
        />
        <TextField
          label="Lead time (days)"
          type="number"
          value={form.leadTimeDays}
          error={errors.leadTimeDays}
          onChange={(v) => set('leadTimeDays', v)}
        />
      </div>
      <TextField
        label="Dimensions"
        value={form.dimensions}
        placeholder="6.0 × 6.0 × 7.5 m"
        onChange={(v) => set('dimensions', v)}
      />
      <div className="flex flex-wrap gap-6 pt-1">
        <CheckboxField
          label="Available to order"
          checked={form.isAvailable}
          onChange={(v) => set('isAvailable', v)}
        />
        <CheckboxField
          label="Publish to public catalogue"
          checked={form.isPublished}
          onChange={(v) => set('isPublished', v)}
        />
      </div>
    </FormDialog>
  );
}

// ─── Row actions ───────────────────────────────────────────────────────────

function RowActions({
  item,
  onEdit,
  onTogglePublish,
  onDelete,
  pending,
}: {
  item: EquipmentRow;
  onEdit: (item: EquipmentRow) => void;
  onTogglePublish: (item: EquipmentRow) => void;
  onDelete: (item: EquipmentRow) => void;
  pending: boolean;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          aria-label={`Actions for ${item.name}`}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
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
            onSelect={() => onEdit(item)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit equipment
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={rowMenuItemClass}
            onSelect={() => onTogglePublish(item)}
          >
            {item.isPublished ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Unpublish
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Publish
              </>
            )}
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            className={rowMenuDestructiveItemClass}
            onSelect={() => onDelete(item)}
          >
            <Trash2 className="h-3.5 w-3.5" /> Archive
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function AdminEquipmentList() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentRow | null>(null);

  const { data, isLoading, isError, refetch } = useEquipment(
    { page, limit: 20 },
    true,
  );
  const { data: categoryData } = useEquipmentCategories();
  const setPublished = useSetEquipmentPublished();
  const deleteEquipment = useDeleteEquipment();

  const equipment = (data?.data as EquipmentRow[] | undefined) ?? [];
  const categories = (categoryData as CategoryOption[] | undefined) ?? [];

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (item: EquipmentRow) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const handleTogglePublish = (item: EquipmentRow) => {
    setPublished.mutate(
      { id: item.id, published: !item.isPublished },
      {
        onSuccess: () =>
          toast.success(
            item.isPublished ? 'Equipment unpublished' : 'Equipment published',
          ),
        onError: (err) => toast.error(apiErrorMessage(err)),
      },
    );
  };

  const handleDelete = (item: EquipmentRow) => {
    if (
      !confirmAction(
        `Archive "${item.name}"? It will be removed from the catalogue. This cannot be undone from here.`,
      )
    )
      return;
    deleteEquipment.mutate(item.id, {
      onSuccess: () => toast.success('Equipment archived'),
      onError: (err) => toast.error(apiErrorMessage(err)),
    });
  };

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
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
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
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <RowActions
          item={row.original}
          onEdit={openEdit}
          onTogglePublish={handleTogglePublish}
          onDelete={handleDelete}
          pending={
            (setPublished.isPending &&
              setPublished.variables?.id === row.original.id) ||
            (deleteEquipment.isPending &&
              deleteEquipment.variables === row.original.id)
          }
        />
      ),
    },
  ];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Equipment Catalogue"
        description="Technical equipment records with applications, specifications and publication state."
        actions={
          <Button
            size="sm"
            variant="brand"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openCreate}
          >
            Add Equipment
          </Button>
        }
      />
      {equipment.length === 0 ? (
        <EmptyState
          icon={<Wrench className="h-6 w-6" />}
          title="No equipment records yet"
          description="Equipment items will appear here once added to the catalogue."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Add Equipment
            </Button>
          }
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

      <EquipmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        categories={categories}
      />
    </div>
  );
}
