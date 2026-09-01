'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  FileText,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Send,
  XCircle,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
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
  useRfqs,
  useCreateRfq,
  useSubmitRfq,
  useCancelRfq,
} from '@/lib/api/hooks/use-rfqs';
import { useClients } from '@/lib/api/hooks/use-clients';
import { useProjects } from '@/lib/api/hooks/use-projects';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { compact, toIsoDate } from '@/lib/api/payload';
import { formatRelativeDate, formatDate } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface RfqItem {
  id: string;
  rfqNumber: string;
  title: string;
  clientId?: string | null;
  clientName: string | null;
  client?: { companyName?: string | null } | null;
  itemsCount: number;
  _count?: { items: number };
  status: string;
  responseDeadline: string | null;
  requiredByDate?: string | null;
  createdAt: string;
}

interface ClientOption {
  id: string;
  companyName: string;
}

interface ProjectOption {
  id: string;
  projectNumber?: string;
  name: string;
}

const selectClass =
  'h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/**
 * Mirrors `CreateRfqDto`: `title` and `items` are required; each item needs a
 * lineNumber, description and quantity (>= 0.01).
 */
const itemSchema = z.object({
  description: z.string().trim().min(3, 'Describe the item'),
  quantity: z.coerce.number().min(0.01, 'Min 0.01'),
  unit: z.string().optional(),
  technicalSpecs: z.string().optional(),
});

const rfqSchema = z.object({
  title: z.string().trim().min(3, 'RFQ title is required'),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  deliveryLocation: z.string().optional(),
  requiredByDate: z.string().optional(),
  description: z.string().optional(),
  technicalRequirements: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one line item'),
});

type RfqFormValues = z.infer<typeof rfqSchema>;

const EMPTY_ITEM = { description: '', quantity: 1, unit: 'EA', technicalSpecs: '' };

const EMPTY_RFQ: RfqFormValues = {
  title: '',
  clientId: '',
  projectId: '',
  deliveryLocation: '',
  requiredByDate: '',
  description: '',
  technicalRequirements: '',
  items: [{ ...EMPTY_ITEM }],
};

interface RowHandlers {
  onSubmit: (rfq: RfqItem) => void;
  onCancel: (rfq: RfqItem) => void;
}

function RowActions({
  item,
  handlers,
}: {
  item: RfqItem;
  handlers: RowHandlers;
}) {
  const isClosed = item.status === 'CANCELLED' || item.status === 'CLOSED';
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
          <DropdownMenu.Item asChild>
            <Link
              href={`/admin/rfqs/${item.id}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            >
              <Eye className="h-3.5 w-3.5" /> View RFQ specs
            </Link>
          </DropdownMenu.Item>
          {item.status === 'DRAFT' && (
            <DropdownMenu.Item
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
              onSelect={() => handlers.onSubmit(item)}
            >
              <Send className="h-3.5 w-3.5" /> Submit RFQ
            </DropdownMenu.Item>
          )}
          {!isClosed && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive outline-none cursor-pointer hover:bg-destructive/10"
                onSelect={() => handlers.onCancel(item)}
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel RFQ
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function buildColumns(handlers: RowHandlers): ColumnDef<RfqItem>[] {
  return [
    {
      accessorKey: 'rfqNumber',
      header: 'RFQ #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.rfqNumber}
        </span>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Title / Equipment Scope',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: 'clientName',
      header: 'Client',
      cell: ({ row }) =>
        row.original.client?.companyName ?? row.original.clientName ?? '—',
    },
    {
      accessorKey: 'itemsCount',
      header: 'Line Items',
      cell: ({ row }) => {
        const count = row.original._count?.items ?? row.original.itemsCount ?? 0;
        return (
          <span className="font-semibold tabular-nums">
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'responseDeadline',
      header: 'Required By',
      cell: ({ row }) => {
        const date =
          row.original.requiredByDate ?? row.original.responseDeadline;
        return (
          <span className="text-xs text-muted-foreground">
            {date ? formatDate(date) : 'ASAP'}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Received',
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

export function AdminRfqsList() {
  const { data: me } = useMe();
  const orgId = me?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useRfqs(orgId);
  const items = (data?.data ?? []) as unknown as RfqItem[];

  const { data: clientsResponse } = useClients<ClientOption>(orgId, {
    limit: 200,
  });
  const clientOptions = clientsResponse?.data ?? [];
  const { data: projectsResponse } = useProjects(orgId, { limit: 200 });
  const projectOptions = (projectsResponse?.data ??
    []) as unknown as ProjectOption[];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState<RfqItem | null>(null);
  const [cancelling, setCancelling] = useState<RfqItem | null>(null);

  const createRfq = useCreateRfq(orgId);
  const submitRfq = useSubmitRfq(orgId, submitting?.id ?? '');
  const cancelRfq = useCancelRfq(orgId, cancelling?.id ?? '');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RfqFormValues>({
    resolver: zodResolver(rfqSchema),
    defaultValues: EMPTY_RFQ,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const openCreate = () => {
    reset(EMPTY_RFQ);
    setDialogOpen(true);
  };

  const handleExport = () => {
    if (!items.length) { toast.error('No data to export'); return; }
    const headers = ['RFQ #', 'Title', 'Client', 'Status', 'Line Items', 'Required By', 'Created'];
    const csv = [
      headers.join(','),
      ...items.map((r) => [
        r.rfqNumber ?? '',
        r.title ?? '',
        r.client?.companyName ?? r.clientName ?? '',
        r.status ?? '',
        r._count?.items ?? r.itemsCount ?? 0,
        (r.requiredByDate ?? r.responseDeadline) ? new Date(r.requiredByDate ?? r.responseDeadline ?? '').toLocaleDateString('en-KE') : 'ASAP',
        new Date(r.createdAt).toLocaleDateString('en-KE'),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `rfqs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Export ready');
  };

  const onSubmit = async (values: RfqFormValues) => {
    const payload = compact({
      title: values.title.trim(),
      clientId: values.clientId,
      projectId: values.projectId,
      deliveryLocation: values.deliveryLocation,
      requiredByDate: toIsoDate(values.requiredByDate),
      description: values.description,
      technicalRequirements: values.technicalRequirements,
      items: values.items.map((item, index) =>
        compact({
          lineNumber: index + 1,
          description: item.description.trim(),
          quantity: item.quantity,
          unit: item.unit || 'EA',
          technicalSpecs: item.technicalSpecs,
        }),
      ),
    });

    try {
      await createRfq.mutateAsync(payload);
      toast.success('RFQ created', { description: values.title });
      setDialogOpen(false);
      reset(EMPTY_RFQ);
    } catch (error) {
      toast.error('Could not create RFQ', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmSubmit = async () => {
    if (!submitting) return;
    try {
      await submitRfq.mutateAsync();
      toast.success('RFQ submitted', { description: submitting.rfqNumber });
      setSubmitting(null);
    } catch (error) {
      toast.error('Could not submit RFQ', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmCancel = async () => {
    if (!cancelling) return;
    try {
      await cancelRfq.mutateAsync();
      toast.success('RFQ cancelled', { description: cancelling.rfqNumber });
      setCancelling(null);
    } catch (error) {
      toast.error('Could not cancel RFQ', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const columns = useMemo(
    () => buildColumns({ onSubmit: setSubmitting, onCancel: setCancelling }),
    [],
  );

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Requests for Quotation (RFQs)"
        description="Client and internal RFQs with line items, attachments, submission state and commercial conversion."
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
              Log RFQ
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
          { label: 'Total Inbound RFQs', value: items.length },
          {
            label: 'Draft',
            value: items.filter((r) => r.status === 'DRAFT').length,
          },
          {
            label: 'Awaiting Response',
            value: items.filter(
              (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW',
            ).length,
          },
          {
            label: 'Responded',
            value: items.filter((r) => r.status === 'RESPONDED').length,
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
          icon={<FileText className="h-6 w-6" />}
          title="No RFQs logged"
          description="Inbound requests for gold plant equipment, turnkey proposals, and replacement components appear here."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Log RFQ
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          searchColumn="title"
          searchPlaceholder="Search RFQs by equipment or client…"
        />
      )}

      {/* Log RFQ Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (createRfq.isPending) return;
          setDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Inbound RFQ</DialogTitle>
            <DialogDescription>
              Record customer specification, equipment line items, and pricing
              deadline.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
            <div className="grid gap-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="rfq-title">
                  RFQ subject / project reference *
                </Label>
                <Input
                  id="rfq-title"
                  placeholder="CIP Plant Equipment Package — Phase 1"
                  {...register('title')}
                  error={errors.title?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rfq-client">Client</Label>
                  <select
                    id="rfq-client"
                    className={selectClass}
                    {...register('clientId')}
                  >
                    <option value="">No client linked</option>
                    {clientOptions.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.companyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rfq-project">Project</Label>
                  <select
                    id="rfq-project"
                    className={selectClass}
                    {...register('projectId')}
                  >
                    <option value="">No project linked</option>
                    {projectOptions.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.projectNumber
                          ? `${project.projectNumber} — `
                          : ''}
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rfq-location">Delivery location</Label>
                  <Input
                    id="rfq-location"
                    placeholder="Bondo, Siaya County"
                    {...register('deliveryLocation')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rfq-deadline">Required by</Label>
                  <Input
                    id="rfq-deadline"
                    type="date"
                    {...register('requiredByDate')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rfq-description">Description</Label>
                <Textarea
                  id="rfq-description"
                  rows={3}
                  className="min-h-[80px]"
                  placeholder="Desired tonnage/capacities, delivery site context…"
                  {...register('description')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rfq-tech">Technical requirements</Label>
                <Textarea
                  id="rfq-tech"
                  rows={2}
                  className="min-h-[64px]"
                  placeholder="Standards, materials of construction, power supply…"
                  {...register('technicalRequirements')}
                />
              </div>

              {/* Line items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Requested items *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={() => append({ ...EMPTY_ITEM })}
                  >
                    Add item
                  </Button>
                </div>
                {errors.items?.message && (
                  <p className="text-xs font-medium text-destructive" role="alert">
                    {errors.items.message}
                  </p>
                )}
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-lg border border-border bg-muted/20 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Item {index + 1}
                      </span>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={`Remove item ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <Input
                      placeholder="Description *"
                      {...register(`items.${index}.description`)}
                      error={errors.items?.[index]?.description?.message}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        type="number"
                        step="0.01"
                        min={0.01}
                        placeholder="Qty *"
                        {...register(`items.${index}.quantity`)}
                        error={errors.items?.[index]?.quantity?.message}
                      />
                      <Input
                        placeholder="Unit"
                        {...register(`items.${index}.unit`)}
                      />
                      <Input
                        placeholder="Technical specs"
                        {...register(`items.${index}.technicalSpecs`)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={createRfq.isPending}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" loading={createRfq.isPending}>
                Create RFQ Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!submitting}
        onOpenChange={(open) => {
          if (!open) setSubmitting(null);
        }}
        title="Submit this RFQ?"
        description={`${submitting?.rfqNumber} moves out of DRAFT and its line items are locked.`}
        confirmLabel="Submit RFQ"
        destructive={false}
        loading={submitRfq.isPending}
        onConfirm={() => void confirmSubmit()}
      />

      {/* RFQs have no DELETE endpoint — cancelling is the terminal action. */}
      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(open) => {
          if (!open) setCancelling(null);
        }}
        title="Cancel this RFQ?"
        description={`${cancelling?.rfqNumber} will be closed as CANCELLED. The record is kept for audit.`}
        confirmLabel="Cancel RFQ"
        cancelLabel="Keep RFQ"
        loading={cancelRfq.isPending}
        onConfirm={() => void confirmCancel()}
      />
    </div>
  );
}
