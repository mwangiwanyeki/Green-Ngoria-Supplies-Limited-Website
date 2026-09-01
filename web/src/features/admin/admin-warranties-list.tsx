'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  ShieldCheck,
  Plus,
  Download,
  MoreHorizontal,
  Pencil,
  ShieldOff,
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
  useAssets,
  useExpiringWarranties,
  useUpsertWarranty,
} from '@/lib/api/hooks/use-assets';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { compact, toIsoDate, toDateInput } from '@/lib/api/payload';
import { formatDate } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface WarrantyRecord {
  id: string;
  assetId: string;
  provider: string;
  startDate: string;
  endDate: string;
  coverage: string | null;
  terms: string | null;
  contractRef: string | null;
  isActive: boolean;
  createdAt: string;
  asset?: { id: string; assetNumber: string; name: string } | null;
}

interface AssetOption {
  id: string;
  assetNumber: string;
  name: string;
}

const selectClass =
  'h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/**
 * Mirrors `CreateWarrantyDto` — `provider`, `startDate` and `endDate` are
 * required; `coverage`, `terms`, `contractRef` and `isActive` are optional.
 * The asset is chosen through the URL (`POST .../assets/:id/warranty`), and the
 * endpoint upserts, so the same form both registers and edits coverage.
 */
const warrantySchema = z
  .object({
    assetId: z.string().uuid('Select the covered asset'),
    provider: z.string().trim().min(2, 'Provider / OEM name is required'),
    startDate: z.string().min(1, 'Pick the coverage start date'),
    endDate: z.string().min(1, 'Pick the coverage expiry date'),
    coverage: z.string().optional(),
    contractRef: z.string().optional(),
    terms: z.string().optional(),
  })
  .refine((values) => new Date(values.endDate) > new Date(values.startDate), {
    path: ['endDate'],
    message: 'Expiry must fall after the start date',
  });

type WarrantyFormValues = z.infer<typeof warrantySchema>;

const EMPTY_WARRANTY: WarrantyFormValues = {
  assetId: '',
  provider: '',
  startDate: '',
  endDate: '',
  coverage: '',
  contractRef: '',
  terms: '',
};

function daysUntil(iso: string) {
  return Math.ceil(
    (new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
}

interface RowHandlers {
  onEdit: (warranty: WarrantyRecord) => void;
  onDeactivate: (warranty: WarrantyRecord) => void;
}

function RowActions({
  item,
  handlers,
}: {
  item: WarrantyRecord;
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
          className="z-50 min-w-[190px] rounded-xl border border-border bg-card p-1 shadow-xl"
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onEdit(item)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit coverage
          </DropdownMenu.Item>
          {item.isActive && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive outline-none cursor-pointer hover:bg-destructive/10"
                onSelect={() => handlers.onDeactivate(item)}
              >
                <ShieldOff className="h-3.5 w-3.5" /> End coverage
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function buildColumns(handlers: RowHandlers): ColumnDef<WarrantyRecord>[] {
  return [
    {
      id: 'assetNumber',
      header: 'Asset #',
      accessorFn: (row) => row.asset?.assetNumber ?? '',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.asset?.assetNumber ?? '—'}
        </span>
      ),
    },
    {
      id: 'assetName',
      header: 'Covered Asset',
      accessorFn: (row) => row.asset?.name ?? '',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.asset?.name ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'provider',
      header: 'Provider / OEM',
      cell: ({ row }) => row.original.provider,
    },
    {
      accessorKey: 'coverage',
      header: 'Coverage',
      cell: ({ row }) =>
        row.original.coverage ? (
          <Badge variant="outline" className="text-xs">
            {row.original.coverage}
          </Badge>
        ) : (
          '—'
        ),
    },
    {
      id: 'validity',
      header: 'Validity Period',
      cell: ({ row }) => (
        <div className="flex flex-col text-xs">
          <span>Until {formatDate(row.original.endDate)}</span>
          <span className="text-muted-foreground">
            From {formatDate(row.original.startDate)}
          </span>
        </div>
      ),
    },
    {
      id: 'expiry',
      header: 'Status',
      cell: ({ row }) => {
        const days = daysUntil(row.original.endDate);
        if (!row.original.isActive) {
          return <Badge variant="mineral">Ended</Badge>;
        }
        if (days < 0) return <Badge variant="destructive">Expired</Badge>;
        return (
          <Badge variant={days <= 30 ? 'warning' : 'success'}>
            {days} days left
          </Badge>
        );
      },
    },
    {
      accessorKey: 'contractRef',
      header: 'Contract Ref',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.contractRef ?? '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <RowActions item={row.original} handlers={handlers} />,
    },
  ];
}

export function AdminWarrantiesList() {
  const { data: me } = useMe();
  const orgId = me?.organizationId ?? '';

  // The only warranty list endpoint the backend exposes is the 90-day expiry
  // window (`GET .../assets/warranties/expiring`).
  const { data, isLoading, isError, refetch } =
    useExpiringWarranties<WarrantyRecord>(orgId);
  const items = data ?? [];

  const { data: assetsResponse } = useAssets<AssetOption>(orgId, {
    limit: 200,
  });
  const assets = assetsResponse?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WarrantyRecord | null>(null);
  const [ending, setEnding] = useState<WarrantyRecord | null>(null);

  const upsertWarranty = useUpsertWarranty(orgId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarrantyFormValues>({
    resolver: zodResolver(warrantySchema),
    defaultValues: EMPTY_WARRANTY,
  });

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_WARRANTY);
    setDialogOpen(true);
  };

  const openEdit = (warranty: WarrantyRecord) => {
    setEditing(warranty);
    reset({
      assetId: warranty.assetId,
      provider: warranty.provider ?? '',
      startDate: toDateInput(warranty.startDate),
      endDate: toDateInput(warranty.endDate),
      coverage: warranty.coverage ?? '',
      contractRef: warranty.contractRef ?? '',
      terms: warranty.terms ?? '',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: WarrantyFormValues) => {
    try {
      await upsertWarranty.mutateAsync({
        assetId: values.assetId,
        data: compact({
          provider: values.provider.trim(),
          startDate: toIsoDate(values.startDate),
          endDate: toIsoDate(values.endDate),
          coverage: values.coverage,
          contractRef: values.contractRef,
          terms: values.terms,
          isActive: true,
        }),
      });
      toast.success(editing ? 'Warranty updated' : 'Warranty registered', {
        description: values.provider,
      });
      setDialogOpen(false);
      setEditing(null);
      reset(EMPTY_WARRANTY);
    } catch (error) {
      toast.error(
        editing ? 'Could not update warranty' : 'Could not register warranty',
        { description: getApiErrorMessage(error) },
      );
    }
  };

  const confirmEnd = async () => {
    if (!ending) return;
    try {
      // There is no delete endpoint — coverage is ended by upserting the same
      // record with `isActive: false`.
      await upsertWarranty.mutateAsync({
        assetId: ending.assetId,
        data: compact({
          provider: ending.provider,
          startDate: ending.startDate,
          endDate: ending.endDate,
          coverage: ending.coverage,
          contractRef: ending.contractRef,
          terms: ending.terms,
          isActive: false,
        }),
      });
      toast.success('Coverage ended', { description: ending.provider });
      setEnding(null);
    } catch (error) {
      toast.error('Could not end coverage', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const columns = useMemo(
    () => buildColumns({ onEdit: openEdit, onDeactivate: setEnding }),
    // openEdit only closes over stable setters and `reset`.
    [],
  );

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  const saving = upsertWarranty.isPending;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Equipment Warranties & Guarantees"
        description="Warranty coverage expiring within the next 90 days, with terms and provider detail for each installed asset."
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
              Register Warranty
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
          { label: 'Expiring Within 90 Days', value: items.length },
          {
            label: 'Still Under Coverage',
            value: items.filter((w) => w.isActive && daysUntil(w.endDate) >= 0)
              .length,
          },
          {
            label: 'Expiring Within 30 Days',
            value: items.filter((w) => {
              const days = daysUntil(w.endDate);
              return w.isActive && days >= 0 && days <= 30;
            }).length,
          },
          {
            label: 'Already Expired',
            value: items.filter((w) => daysUntil(w.endDate) < 0).length,
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
          icon={<ShieldCheck className="h-6 w-6" />}
          title="No warranties expiring soon"
          description="Coverage due to lapse within 90 days appears here. Register OEM guarantees for newly installed assets."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Register Warranty
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          searchColumn="assetName"
          searchPlaceholder="Search warranties by asset name…"
        />
      )}

      {/* Register / Edit Warranty Dialog */}
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
              {editing
                ? 'Edit Warranty Coverage'
                : 'Register Equipment Warranty'}
            </DialogTitle>
            <DialogDescription>
              Each asset carries a single warranty record, so saving replaces
              any coverage already registered against the selected asset.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
          >
            <div className="grid gap-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="warranty-asset">Covered asset *</Label>
                <select
                  id="warranty-asset"
                  className={selectClass}
                  disabled={!!editing}
                  {...register('assetId')}
                >
                  <option value="">Select an asset…</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.assetNumber} — {asset.name}
                    </option>
                  ))}
                </select>
                {errors.assetId && (
                  <p
                    className="text-xs font-medium text-destructive"
                    role="alert"
                  >
                    {errors.assetId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="warranty-provider">Provider / OEM *</Label>
                <Input
                  id="warranty-provider"
                  placeholder="Metso Outotec"
                  {...register('provider')}
                  error={errors.provider?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="warranty-start">Start date *</Label>
                  <Input
                    id="warranty-start"
                    type="date"
                    {...register('startDate')}
                    error={errors.startDate?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="warranty-end">Expiry date *</Label>
                  <Input
                    id="warranty-end"
                    type="date"
                    {...register('endDate')}
                    error={errors.endDate?.message}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="warranty-coverage">Coverage</Label>
                <Input
                  id="warranty-coverage"
                  placeholder="24 months full mechanical & structural"
                  {...register('coverage')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="warranty-ref">Contract reference</Label>
                <Input
                  id="warranty-ref"
                  placeholder="WTY-2026-0142"
                  {...register('contractRef')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="warranty-terms">Terms</Label>
                <Textarea
                  id="warranty-terms"
                  rows={3}
                  className="min-h-[80px]"
                  placeholder="Response SLA, exclusions, wear-part carve-outs…"
                  {...register('terms')}
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
                {editing ? 'Save Changes' : 'Save Warranty'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!ending}
        onOpenChange={(open) => {
          if (!open) setEnding(null);
        }}
        title="End this warranty coverage?"
        description={
          <>
            Coverage from {ending?.provider} on{' '}
            {ending?.asset?.name ?? 'this asset'} will be marked inactive. The
            record is kept for audit and can be reactivated by editing it.
          </>
        }
        confirmLabel="End coverage"
        cancelLabel="Keep coverage"
        loading={upsertWarranty.isPending}
        onConfirm={() => void confirmEnd()}
      />
    </div>
  );
}
