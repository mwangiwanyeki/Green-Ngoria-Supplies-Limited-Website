'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Boxes,
  Plus,
  Download,
  MoreHorizontal,
  Pencil,
  PackagePlus,
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
  useSpares,
  useCreateSpare,
  useUpdateSpare,
  useAdjustStock,
  useEquipment,
} from '@/lib/api/hooks/use-equipment';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { compact, toStringArray } from '@/lib/api/payload';
import { formatCurrency } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface SparePart {
  id: string;
  equipmentId: string | null;
  sku: string;
  name: string;
  partNumber: string | null;
  manufacturer: string | null;
  description: string | null;
  quantityInStock: number;
  reorderLevel: number;
  unitPrice: number | string | null;
  currency: string;
  isAvailable: boolean;
  leadTimeDays: number | null;
  compatibleEquipment: string[];
  createdAt: string;
  equipment?: { id: string; name: string; sku: string } | null;
}

interface EquipmentOption {
  id: string;
  sku: string;
  name: string;
}

/** Matches `Currency` in prisma/schema.prisma. */
const CURRENCIES = ['USD', 'KES', 'TZS', 'UGX', 'RWF', 'EUR', 'GBP'] as const;

const selectClass =
  'h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/**
 * Mirrors `CreateSparePartDto` — `sku` and `name` are the only `@IsNotEmpty()`
 * fields. `PATCH /equipment/spares/:id` binds the same DTO, so both always
 * travel with an update.
 */
const spareSchema = z.object({
  sku: z.string().trim().min(2, 'SKU is required'),
  name: z.string().trim().min(2, 'Part name is required'),
  equipmentId: z.string().optional(),
  partNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  quantityInStock: z.string().optional(),
  reorderLevel: z.string().optional(),
  unitPrice: z.string().optional(),
  currency: z.string().optional(),
  leadTimeDays: z.string().optional(),
  compatibleEquipment: z.string().optional(),
});

type SpareFormValues = z.infer<typeof spareSchema>;

const EMPTY_SPARE: SpareFormValues = {
  sku: '',
  name: '',
  equipmentId: '',
  partNumber: '',
  manufacturer: '',
  description: '',
  quantityInStock: '',
  reorderLevel: '',
  unitPrice: '',
  currency: 'USD',
  leadTimeDays: '',
  compatibleEquipment: '',
};

const adjustSchema = z.object({
  adjustment: z
    .string()
    .min(1, 'Enter a quantity')
    .refine((value) => Number(value) !== 0 && !Number.isNaN(Number(value)), {
      message: 'Enter a non-zero number (negative removes stock)',
    }),
  reason: z.string().trim().min(3, 'Give a reason for the adjustment'),
});

type AdjustFormValues = z.infer<typeof adjustSchema>;

interface RowHandlers {
  onEdit: (spare: SparePart) => void;
  onAdjust: (spare: SparePart) => void;
}

function RowActions({
  item,
  handlers,
}: {
  item: SparePart;
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
            onSelect={() => handlers.onEdit(item)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit part
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onAdjust(item)}
          >
            <PackagePlus className="h-3.5 w-3.5" /> Adjust stock
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function buildColumns(handlers: RowHandlers): ColumnDef<SparePart>[] {
  return [
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
      header: 'Spare Part',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.partNumber ?? row.original.manufacturer ?? ''}
          </span>
        </div>
      ),
    },
    {
      id: 'equipment',
      header: 'Parent Equipment',
      cell: ({ row }) =>
        row.original.equipment?.name ??
        (row.original.compatibleEquipment?.length
          ? row.original.compatibleEquipment.join(', ')
          : 'General / Universal'),
    },
    {
      accessorKey: 'quantityInStock',
      header: 'Stock Level',
      cell: ({ row }) => {
        const isLow =
          (row.original.quantityInStock ?? 0) <=
          (row.original.reorderLevel ?? 0);
        return (
          <span
            className={`font-semibold tabular-nums ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}
          >
            {row.original.quantityInStock ?? 0} pcs {isLow && '(Low)'}
          </span>
        );
      },
    },
    {
      accessorKey: 'unitPrice',
      header: 'Unit Price',
      cell: ({ row }) =>
        row.original.unitPrice != null ? (
          <span className="font-semibold tabular-nums text-teal-600 dark:text-teal-400">
            {formatCurrency(
              Number(row.original.unitPrice),
              row.original.currency || 'USD',
            )}
          </span>
        ) : (
          '—'
        ),
    },
    {
      accessorKey: 'leadTimeDays',
      header: 'Lead Time',
      cell: ({ row }) =>
        row.original.leadTimeDays != null
          ? `${row.original.leadTimeDays} days`
          : '—',
    },
    {
      accessorKey: 'isAvailable',
      header: 'Availability',
      cell: ({ row }) => (
        <Badge variant={row.original.isAvailable ? 'success' : 'mineral'}>
          {row.original.isAvailable ? 'Available' : 'Unavailable'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <RowActions item={row.original} handlers={handlers} />,
    },
  ];
}

export function AdminSparesList() {
  const { data, isLoading, isError, refetch } = useSpares({ limit: 100 });
  const items = (data?.data ?? []) as unknown as SparePart[];

  const { data: equipmentResponse } = useEquipment({ limit: 200 }, true);
  const equipment = (equipmentResponse?.data ??
    []) as unknown as EquipmentOption[];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SparePart | null>(null);
  const [adjusting, setAdjusting] = useState<SparePart | null>(null);

  const createSpare = useCreateSpare();
  const updateSpare = useUpdateSpare(editing?.id ?? '');
  const adjustStock = useAdjustStock(adjusting?.id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SpareFormValues>({
    resolver: zodResolver(spareSchema),
    defaultValues: EMPTY_SPARE,
  });

  const adjustForm = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { adjustment: '', reason: '' },
  });

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_SPARE);
    setDialogOpen(true);
  };

  const openEdit = (spare: SparePart) => {
    setEditing(spare);
    reset({
      sku: spare.sku ?? '',
      name: spare.name ?? '',
      equipmentId: spare.equipmentId ?? '',
      partNumber: spare.partNumber ?? '',
      manufacturer: spare.manufacturer ?? '',
      description: spare.description ?? '',
      quantityInStock:
        spare.quantityInStock != null ? String(spare.quantityInStock) : '',
      reorderLevel:
        spare.reorderLevel != null ? String(spare.reorderLevel) : '',
      unitPrice: spare.unitPrice != null ? String(spare.unitPrice) : '',
      currency: spare.currency ?? 'USD',
      leadTimeDays:
        spare.leadTimeDays != null ? String(spare.leadTimeDays) : '',
      compatibleEquipment: (spare.compatibleEquipment ?? []).join(', '),
    });
    setDialogOpen(true);
  };

  const openAdjust = (spare: SparePart) => {
    setAdjusting(spare);
    adjustForm.reset({ adjustment: '', reason: '' });
  };

  const onSubmit = async (values: SpareFormValues) => {
    const payload = compact({
      sku: values.sku.trim(),
      name: values.name.trim(),
      equipmentId: values.equipmentId,
      partNumber: values.partNumber,
      manufacturer: values.manufacturer,
      description: values.description,
      quantityInStock: values.quantityInStock
        ? Number(values.quantityInStock)
        : undefined,
      reorderLevel: values.reorderLevel
        ? Number(values.reorderLevel)
        : undefined,
      unitPrice: values.unitPrice ? Number(values.unitPrice) : undefined,
      currency: values.currency,
      leadTimeDays: values.leadTimeDays
        ? Number(values.leadTimeDays)
        : undefined,
      compatibleEquipment: toStringArray(values.compatibleEquipment),
    });
    try {
      if (editing) {
        await updateSpare.mutateAsync(payload);
        toast.success('Spare part updated', { description: values.name });
      } else {
        await createSpare.mutateAsync(payload);
        toast.success('Spare part added', { description: values.name });
      }
      setDialogOpen(false);
      setEditing(null);
      reset(EMPTY_SPARE);
    } catch (error) {
      toast.error(
        editing ? 'Could not update spare part' : 'Could not add spare part',
        { description: getApiErrorMessage(error) },
      );
    }
  };

  const onAdjustSubmit = async (values: AdjustFormValues) => {
    if (!adjusting) return;
    try {
      await adjustStock.mutateAsync({
        adjustment: Number(values.adjustment),
        reason: values.reason.trim(),
      });
      toast.success('Stock adjusted', { description: adjusting.name });
      setAdjusting(null);
      adjustForm.reset({ adjustment: '', reason: '' });
      void refetch();
    } catch (error) {
      toast.error('Could not adjust stock', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const columns = useMemo(
    () => buildColumns({ onEdit: openEdit, onAdjust: openAdjust }),
    // openEdit/openAdjust only close over stable setters and form `reset`.
    [],
  );

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  const saving = createSpare.isPending || updateSpare.isPending;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Spare Parts Catalogue"
        description="Traceable spare parts linked to equipment, stock context and RFQ workflows."
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
              Add Part
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
          { label: 'Catalogued Spares', value: items.length },
          {
            label: 'Available',
            value: items.filter((s) => s.isAvailable).length,
          },
          {
            label: 'Low Stock Alerts',
            value: items.filter(
              (s) => (s.quantityInStock ?? 0) <= (s.reorderLevel ?? 0),
            ).length,
          },
          {
            label: 'Units In Stock',
            value: items.reduce((sum, s) => sum + (s.quantityInStock ?? 0), 0),
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
          icon={<Boxes className="h-6 w-6" />}
          title="No spare parts registered"
          description="Catalogue ball mill liners, jaw plates, flotation impellers, and slurry pump seals."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Add Part
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          searchColumn="name"
          searchPlaceholder="Search spare parts by name…"
        />
      )}

      {/* Add / Edit Spare Dialog */}
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
              {editing ? 'Edit Spare Part' : 'Add Spare Part'}
            </DialogTitle>
            <DialogDescription>
              Register technical specs, compatibility, and reorder levels.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
          >
            <div className="grid gap-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="spare-name">Part name *</Label>
                  <Input
                    id="spare-name"
                    placeholder="Gearbox assembly — CIP agitator drive"
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="spare-sku">SKU *</Label>
                  <Input
                    id="spare-sku"
                    placeholder="SP-GEARBOX-001"
                    {...register('sku')}
                    error={errors.sku?.message}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="spare-equipment">Parent equipment</Label>
                <select
                  id="spare-equipment"
                  className={selectClass}
                  {...register('equipmentId')}
                >
                  <option value="">Not linked to catalogue equipment</option>
                  {equipment.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} — {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="spare-partnumber">Part number</Label>
                  <Input
                    id="spare-partnumber"
                    placeholder="GB-4500-A"
                    {...register('partNumber')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="spare-manufacturer">Manufacturer</Label>
                  <Input
                    id="spare-manufacturer"
                    placeholder="SEW-Eurodrive"
                    {...register('manufacturer')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="spare-stock">Stock on hand</Label>
                  <Input
                    id="spare-stock"
                    type="number"
                    min={0}
                    step="1"
                    placeholder="0"
                    {...register('quantityInStock')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="spare-reorder">Reorder threshold</Label>
                  <Input
                    id="spare-reorder"
                    type="number"
                    min={0}
                    step="1"
                    placeholder="0"
                    {...register('reorderLevel')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="spare-price">Unit price</Label>
                  <Input
                    id="spare-price"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    {...register('unitPrice')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="spare-currency">Currency</Label>
                  <select
                    id="spare-currency"
                    className={selectClass}
                    {...register('currency')}
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="spare-lead">Lead time (days)</Label>
                  <Input
                    id="spare-lead"
                    type="number"
                    min={0}
                    step="1"
                    placeholder="0"
                    {...register('leadTimeDays')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="spare-compatible">Compatible equipment</Label>
                <Input
                  id="spare-compatible"
                  placeholder="EQ-MILL-01, EQ-MILL-02"
                  {...register('compatibleEquipment')}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated SKUs or model names.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="spare-description">Description</Label>
                <Textarea
                  id="spare-description"
                  rows={3}
                  className="min-h-[80px]"
                  placeholder="Material, dimensions, mounting notes…"
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
                {editing ? 'Save Changes' : 'Add Spare Part'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock adjustment dialog */}
      <Dialog
        open={!!adjusting}
        onOpenChange={(open) => {
          if (adjustStock.isPending) return;
          if (!open) setAdjusting(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust stock</DialogTitle>
            <DialogDescription>
              {adjusting?.name} currently holds{' '}
              {adjusting?.quantityInStock ?? 0} units. Use a negative number to
              remove stock.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) =>
              void adjustForm.handleSubmit(onAdjustSubmit)(event)
            }
            noValidate
          >
            <div className="grid gap-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="adjust-quantity">Adjustment *</Label>
                <Input
                  id="adjust-quantity"
                  type="number"
                  step="1"
                  placeholder="e.g. 12 or -3"
                  {...adjustForm.register('adjustment')}
                  error={adjustForm.formState.errors.adjustment?.message}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adjust-reason">Reason *</Label>
                <Input
                  id="adjust-reason"
                  placeholder="Goods received against PO-2026-0031"
                  {...adjustForm.register('reason')}
                  error={adjustForm.formState.errors.reason?.message}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={adjustStock.isPending}
                onClick={() => setAdjusting(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="brand"
                loading={adjustStock.isPending}
              >
                Apply adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
