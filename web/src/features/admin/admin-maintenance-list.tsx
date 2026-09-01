'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Wrench,
  Plus,
  Download,
  MoreHorizontal,
  ArrowRight,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, Badge } from '@/components/ui/badge';
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
  useWorkOrders,
  useCreateWorkOrder,
  useTransitionWorkOrder,
} from '@/lib/api/hooks/use-assets';
import { useUserDirectory } from '@/lib/api/hooks/use-users';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { compact, toIsoDate } from '@/lib/api/payload';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  assetId: string;
  type: string;
  status: string;
  title: string;
  description: string;
  scheduledDate: string | null;
  completedAt: string | null;
  assignedToId: string | null;
  completionNotes: string | null;
  createdAt: string;
  asset?: { id: string; assetNumber: string; name: string } | null;
}

interface AssetOption {
  id: string;
  assetNumber: string;
  name: string;
}

interface DirectoryUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** Matches `MaintenanceType` in prisma/schema.prisma. */
const MAINTENANCE_TYPES = [
  'PREVENTIVE',
  'CORRECTIVE',
  'EMERGENCY',
  'PREDICTIVE',
  'SHUTDOWN',
] as const;

/** Matches `WorkOrderStatus` in prisma/schema.prisma. */
const WORK_ORDER_STATUSES = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'COMPLETED',
  'VERIFIED',
  'CLOSED',
] as const;

/** Matches `Currency` in prisma/schema.prisma. */
const CURRENCIES = ['USD', 'KES', 'TZS', 'UGX', 'RWF', 'EUR', 'GBP'] as const;

const selectClass =
  'h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/**
 * Mirrors `CreateWorkOrderDto` — `assetId` (`@IsUUID()`), `type`
 * (`@IsEnum(MaintenanceType)`), `title` and `description` (`@IsNotEmpty()`) are
 * required. There is no PATCH for work orders: after creation they only move
 * through `POST .../work-orders/:woId/transition`.
 */
const workOrderSchema = z.object({
  assetId: z.string().uuid('Select the asset this work order covers'),
  type: z.string().min(1, 'Select a maintenance type'),
  title: z.string().trim().min(3, 'Give the work order a short title'),
  description: z.string().trim().min(5, 'Describe the work to be performed'),
  scheduledDate: z.string().optional(),
  assignedToId: z.string().optional(),
  currency: z.string().optional(),
});

type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

const EMPTY_WORK_ORDER: WorkOrderFormValues = {
  assetId: '',
  type: 'PREVENTIVE',
  title: '',
  description: '',
  scheduledDate: '',
  assignedToId: '',
  currency: 'USD',
};

const TERMINAL_STATUSES = ['CLOSED', 'CANCELLED'];

interface RowHandlers {
  onTransition: (wo: WorkOrder) => void;
  onComplete: (wo: WorkOrder) => void;
  onCancel: (wo: WorkOrder) => void;
}

function RowActions({
  item,
  handlers,
}: {
  item: WorkOrder;
  handlers: RowHandlers;
}) {
  const isTerminal = TERMINAL_STATUSES.includes(item.status);
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
          className="z-50 min-w-[180px] rounded-xl border border-border bg-card p-1 shadow-xl"
        >
          {!isTerminal && (
            <DropdownMenu.Item
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
              onSelect={() => handlers.onTransition(item)}
            >
              <ArrowRight className="h-3.5 w-3.5" /> Change status
            </DropdownMenu.Item>
          )}
          {!isTerminal && item.status !== 'COMPLETED' && (
            <DropdownMenu.Item
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-emerald-600 outline-none cursor-pointer hover:bg-emerald-500/10"
              onSelect={() => handlers.onComplete(item)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark complete
            </DropdownMenu.Item>
          )}
          {!isTerminal && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive outline-none cursor-pointer hover:bg-destructive/10"
                onSelect={() => handlers.onCancel(item)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Cancel work order
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function buildColumns(handlers: RowHandlers): ColumnDef<WorkOrder>[] {
  return [
    {
      accessorKey: 'workOrderNumber',
      header: 'WO #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.workOrderNumber}
        </span>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Work Order',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.title}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.asset?.name ?? '—'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge
          variant={row.original.type === 'PREVENTIVE' ? 'brand' : 'warning'}
        >
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'scheduledDate',
      header: 'Target Date',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.scheduledDate
            ? formatDate(row.original.scheduledDate)
            : 'Unscheduled'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Raised',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(row.original.createdAt)}
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

export function AdminMaintenanceList() {
  const { data: me } = useMe();
  const orgId = me?.organizationId ?? '';

  const { data, isLoading, isError, refetch } = useWorkOrders(orgId);
  const items = (data?.data ?? []) as unknown as WorkOrder[];

  const { data: assetsResponse } = useAssets<AssetOption>(orgId, {
    limit: 200,
  });
  const assets = assetsResponse?.data ?? [];

  const { data: directoryResponse } = useUserDirectory<DirectoryUser>({
    limit: 200,
  });
  const technicians = directoryResponse?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [transitioning, setTransitioning] = useState<WorkOrder | null>(null);
  const [nextStatus, setNextStatus] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [cancelling, setCancelling] = useState<WorkOrder | null>(null);

  const createWorkOrder = useCreateWorkOrder(orgId);
  const transitionWorkOrder = useTransitionWorkOrder(
    orgId,
    transitioning?.id ?? '',
  );
  const cancelWorkOrder = useTransitionWorkOrder(orgId, cancelling?.id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: EMPTY_WORK_ORDER,
  });

  const openCreate = () => {
    reset(EMPTY_WORK_ORDER);
    setDialogOpen(true);
  };

  const onSubmit = async (values: WorkOrderFormValues) => {
    try {
      await createWorkOrder.mutateAsync(
        compact({
          assetId: values.assetId,
          type: values.type,
          title: values.title.trim(),
          description: values.description.trim(),
          scheduledDate: toIsoDate(values.scheduledDate),
          assignedToId: values.assignedToId,
          currency: values.currency,
        }),
      );
      toast.success('Work order created', { description: values.title });
      setDialogOpen(false);
      reset(EMPTY_WORK_ORDER);
    } catch (error) {
      toast.error('Could not create work order', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmTransition = async () => {
    if (!transitioning || !nextStatus) return;
    try {
      await transitionWorkOrder.mutateAsync(
        compact({ status: nextStatus, completionNotes }) as {
          status: string;
          completionNotes?: string;
        },
      );
      toast.success(`Work order moved to ${nextStatus.replace(/_/g, ' ')}`, {
        description: transitioning.workOrderNumber,
      });
      setTransitioning(null);
      setNextStatus('');
      setCompletionNotes('');
    } catch (error) {
      toast.error('Could not change work order status', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmCancel = async () => {
    if (!cancelling) return;
    try {
      await cancelWorkOrder.mutateAsync({ status: 'CANCELLED' });
      toast.success('Work order cancelled', {
        description: cancelling.workOrderNumber,
      });
      setCancelling(null);
    } catch (error) {
      toast.error('Could not cancel work order', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const openTransition = (wo: WorkOrder, presetStatus?: string) => {
    setTransitioning(wo);
    const idx = WORK_ORDER_STATUSES.indexOf(
      wo.status as (typeof WORK_ORDER_STATUSES)[number],
    );
    setNextStatus(presetStatus ?? WORK_ORDER_STATUSES[idx + 1] ?? '');
    setCompletionNotes(wo.completionNotes ?? '');
  };

  const columns = useMemo(
    () =>
      buildColumns({
        onTransition: (wo) => openTransition(wo),
        onComplete: (wo) => openTransition(wo, 'COMPLETED'),
        onCancel: setCancelling,
      }),
    // openTransition only closes over stable setters.
    [],
  );

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Plant Asset Maintenance"
        description="Preventive and corrective work orders connected to assets, people, parts and completion evidence."
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
              New Work Order
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
          {
            label: 'Open Work Orders',
            value: items.filter((w) => !TERMINAL_STATUSES.includes(w.status))
              .length,
          },
          {
            label: 'Preventive PM',
            value: items.filter((w) => w.type === 'PREVENTIVE').length,
          },
          {
            label: 'Corrective Repairs',
            value: items.filter((w) => w.type === 'CORRECTIVE').length,
          },
          {
            label: 'Completed',
            value: items.filter((w) =>
              ['COMPLETED', 'VERIFIED', 'CLOSED'].includes(w.status),
            ).length,
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
          icon={<Wrench className="h-6 w-6" />}
          title="No work orders open"
          description="Schedule mill lubrication, jaw plate rotation, and CIP agitator gearbox overhauls."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              New Work Order
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          searchColumn="title"
          searchPlaceholder="Search work orders by title…"
        />
      )}

      {/* Create Work Order Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (createWorkOrder.isPending) return;
          setDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Maintenance Work Order</DialogTitle>
            <DialogDescription>
              Assign mechanical or electrical service tasks to plant maintenance
              personnel.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
          >
            <div className="grid gap-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="wo-asset">Asset *</Label>
                <select
                  id="wo-asset"
                  className={selectClass}
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
                <Label htmlFor="wo-title">Title *</Label>
                <Input
                  id="wo-title"
                  placeholder="Primary ball mill gearbox oil change"
                  {...register('title')}
                  error={errors.title?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="wo-type">Maintenance type *</Label>
                  <select
                    id="wo-type"
                    className={selectClass}
                    {...register('type')}
                  >
                    {MAINTENANCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wo-scheduled">Scheduled date</Label>
                  <Input
                    id="wo-scheduled"
                    type="date"
                    {...register('scheduledDate')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="wo-assignee">Assigned technician</Label>
                  <select
                    id="wo-assignee"
                    className={selectClass}
                    {...register('assignedToId')}
                  >
                    <option value="">Unassigned</option>
                    {technicians.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wo-currency">Cost currency</Label>
                  <select
                    id="wo-currency"
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
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wo-description">Description *</Label>
                <Textarea
                  id="wo-description"
                  rows={3}
                  className="min-h-[90px]"
                  placeholder="Maintenance instructions, torque specs, safety lockout procedures…"
                  {...register('description')}
                  error={errors.description?.message}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={createWorkOrder.isPending}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="brand"
                loading={createWorkOrder.isPending}
              >
                Issue Work Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transition dialog */}
      <Dialog
        open={!!transitioning}
        onOpenChange={(open) => {
          if (transitionWorkOrder.isPending) return;
          if (!open) {
            setTransitioning(null);
            setNextStatus('');
            setCompletionNotes('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change work order status</DialogTitle>
            <DialogDescription>
              {transitioning?.workOrderNumber} is currently{' '}
              {transitioning?.status.replace(/_/g, ' ')}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="wo-next-status">Move to</Label>
              <select
                id="wo-next-status"
                className={selectClass}
                value={nextStatus}
                onChange={(event) => setNextStatus(event.target.value)}
              >
                <option value="">Select status…</option>
                {WORK_ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-notes">Completion notes</Label>
              <Textarea
                id="wo-notes"
                rows={3}
                className="min-h-[80px]"
                placeholder="Findings, parts replaced, follow-up required…"
                value={completionNotes}
                onChange={(event) => setCompletionNotes(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={transitionWorkOrder.isPending}
              onClick={() => {
                setTransitioning(null);
                setNextStatus('');
                setCompletionNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              disabled={!nextStatus}
              loading={transitionWorkOrder.isPending}
              onClick={() => void confirmTransition()}
            >
              Update status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(open) => {
          if (!open) setCancelling(null);
        }}
        title="Cancel this work order?"
        description={
          <>
            {cancelling?.workOrderNumber} will move to CANCELLED. The record is
            kept for maintenance history.
          </>
        }
        confirmLabel="Cancel work order"
        cancelLabel="Keep it open"
        loading={cancelWorkOrder.isPending}
        onConfirm={() => void confirmCancel()}
      />
    </div>
  );
}
