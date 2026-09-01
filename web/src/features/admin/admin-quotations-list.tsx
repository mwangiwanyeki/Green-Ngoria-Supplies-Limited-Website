'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  FileCheck,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Send,
  CheckCircle2,
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
import { Input, Textarea, Label } from '@/components/ui/input';
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useQuotations,
  useCreateQuotation,
  useReviseQuotation,
  useRejectQuotation,
  useSendQuotation,
  useApproveQuotation,
} from '@/lib/api/hooks/use-quotations';
import { useClients } from '@/lib/api/hooks/use-clients';
import { useRfqs } from '@/lib/api/hooks/use-rfqs';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { compact, toIsoDate } from '@/lib/api/payload';
import { formatRelativeDate, formatCurrency } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { QuotationSummary } from '@/lib/api/models';

interface ClientOption {
  id: string;
  companyName: string;
}

interface RfqOption {
  id: string;
  rfqNumber?: string;
  title: string;
}

const CURRENCIES = ['USD', 'KES', 'TZS', 'UGX', 'RWF', 'EUR', 'GBP'] as const;

const selectClass =
  'h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/**
 * Mirrors `CreateQuotationDto`: `title` and `lineItems` are required; each line
 * item needs lineNumber, description, quantity (>= 0.01) and unitPrice.
 */
const lineItemSchema = z.object({
  description: z.string().trim().min(3, 'Describe the line item'),
  quantity: z.coerce.number().min(0.01, 'Min 0.01'),
  unit: z.string().optional(),
  unitPrice: z.coerce.number().min(0, 'Cannot be negative'),
  leadTimeDays: z.string().optional(),
});

const quotationSchema = z.object({
  title: z.string().trim().min(3, 'Quotation title is required'),
  clientId: z.string().optional(),
  rfqId: z.string().optional(),
  currency: z.string().optional(),
  taxRate: z.string().optional(),
  validUntil: z.string().optional(),
  description: z.string().optional(),
  deliveryTerms: z.string().optional(),
  paymentTerms: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'Add at least one line item'),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

const EMPTY_LINE = {
  description: '',
  quantity: 1,
  unit: 'EA',
  unitPrice: 0,
  leadTimeDays: '',
};

const EMPTY_QUOTATION: QuotationFormValues = {
  title: '',
  clientId: '',
  rfqId: '',
  currency: 'USD',
  taxRate: '16',
  validUntil: '',
  description: '',
  deliveryTerms: '',
  paymentTerms: '',
  lineItems: [{ ...EMPTY_LINE }],
};

interface RowHandlers {
  onRevise: (quotation: QuotationSummary) => void;
  onSend: (quotation: QuotationSummary) => void;
  onApprove: (quotation: QuotationSummary) => void;
  onReject: (quotation: QuotationSummary) => void;
}

function RowActions({
  quotation,
  handlers,
}: {
  quotation: QuotationSummary;
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
          className="z-50 min-w-[180px] rounded-xl border border-border bg-card p-1 shadow-xl"
        >
          <DropdownMenu.Item asChild>
            <Link
              href={`/admin/quotations/${quotation.id}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            >
              <Eye className="h-3.5 w-3.5" /> View quotation
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onRevise(quotation)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit (new revision)
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onApprove(quotation)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onSend(quotation)}
          >
            <Send className="h-3.5 w-3.5" /> Send to client
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive outline-none cursor-pointer hover:bg-destructive/10"
            onSelect={() => handlers.onReject(quotation)}
          >
            <XCircle className="h-3.5 w-3.5" /> Reject
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function buildColumns(handlers: RowHandlers): ColumnDef<QuotationSummary>[] {
  return [
    {
      accessorKey: 'quoteNumber',
      header: 'Quote #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.quoteNumber}
        </span>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <Link
          href={`/admin/quotations/${row.original.id}`}
          className="font-medium hover:text-teal-600 dark:hover:text-teal-400 transition-colors max-w-[220px] truncate block"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      id: 'client',
      header: 'Client',
      cell: ({ row }) => row.original.client?.companyName ?? '—',
    },
    {
      accessorKey: 'totalAmount',
      header: 'Value',
      cell: ({ row }) => (
        <span className="font-semibold text-teal-600 dark:text-teal-400 tabular-nums whitespace-nowrap">
          {formatCurrency(row.original.totalAmount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'revision',
      header: 'Rev',
      cell: ({ row }) => (
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono">
          R{row.original.revision ?? 0}
        </span>
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
      cell: ({ row }) => (
        <RowActions quotation={row.original} handlers={handlers} />
      ),
    },
  ];
}

export function AdminQuotationsList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useQuotations(orgId, {
    limit: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const quotations = data?.data ?? [];

  const { data: clientsResponse } = useClients<ClientOption>(orgId, {
    limit: 200,
  });
  const clientOptions = clientsResponse?.data ?? [];
  const { data: rfqsResponse } = useRfqs(orgId, { limit: 200 });
  const rfqOptions = (rfqsResponse?.data ?? []) as unknown as RfqOption[];

  const [dialogOpen, setDialogOpen] = useState(false);
  /** Quotations have no PATCH — an "edit" is a new revision with a reason. */
  const [revising, setRevising] = useState<QuotationSummary | null>(null);
  const [reviseReason, setReviseReason] = useState('');
  const [rejecting, setRejecting] = useState<QuotationSummary | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState<QuotationSummary | null>(null);

  const createQuotation = useCreateQuotation(orgId);
  const reviseQuotation = useReviseQuotation(orgId, revising?.id ?? '');
  const rejectQuotation = useRejectQuotation(orgId, rejecting?.id ?? '');
  const sendQuotation = useSendQuotation(orgId, acting?.id ?? '');
  const approveQuotation = useApproveQuotation(orgId, acting?.id ?? '');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: EMPTY_QUOTATION,
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const openCreate = () => {
    reset(EMPTY_QUOTATION);
    setDialogOpen(true);
  };

  const handleExport = () => {
    if (!quotations.length) { toast.error('No data to export'); return; }
    const headers = ['Quote #', 'Title', 'Client', 'Status', 'Rev', 'Currency', 'Total', 'Valid Until', 'Created'];
    const csv = [
      headers.join(','),
      ...quotations.map((q) => [
        q.quoteNumber ?? '',
        q.title ?? '',
        q.client?.companyName ?? '',
        q.status ?? '',
        `R${q.revision ?? 0}`,
        q.currency ?? '',
        Number(q.totalAmount ?? 0).toFixed(2),
        q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-KE') : '',
        new Date(q.createdAt).toLocaleDateString('en-KE'),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `quotations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Export ready');
  };

  const onSubmit = async (values: QuotationFormValues) => {
    const payload = compact({
      title: values.title.trim(),
      clientId: values.clientId,
      rfqId: values.rfqId,
      currency: values.currency,
      taxRate: values.taxRate ? Number(values.taxRate) : undefined,
      validUntil: toIsoDate(values.validUntil),
      description: values.description,
      deliveryTerms: values.deliveryTerms,
      paymentTerms: values.paymentTerms,
      lineItems: values.lineItems.map((item, index) =>
        compact({
          lineNumber: index + 1,
          description: item.description.trim(),
          quantity: item.quantity,
          unit: item.unit || 'EA',
          unitPrice: item.unitPrice,
          leadTimeDays: item.leadTimeDays
            ? Number(item.leadTimeDays)
            : undefined,
        }),
      ),
    });

    try {
      await createQuotation.mutateAsync(payload);
      toast.success('Quotation created', { description: values.title });
      setDialogOpen(false);
      reset(EMPTY_QUOTATION);
    } catch (error) {
      toast.error('Could not create quotation', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmRevise = async () => {
    if (!revising) return;
    try {
      await reviseQuotation.mutateAsync(reviseReason.trim());
      toast.success('New revision created', {
        description: `${revising.quoteNumber} is back in DRAFT for editing.`,
      });
      setRevising(null);
      setReviseReason('');
    } catch (error) {
      toast.error('Could not create revision', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    try {
      await rejectQuotation.mutateAsync(rejectReason.trim());
      toast.success('Quotation rejected', {
        description: rejecting.quoteNumber,
      });
      setRejecting(null);
      setRejectReason('');
    } catch (error) {
      toast.error('Could not reject quotation', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const runAction = async (kind: 'send' | 'approve') => {
    if (!acting) return;
    const mutation = kind === 'send' ? sendQuotation : approveQuotation;
    try {
      await mutation.mutateAsync();
      toast.success(
        kind === 'send' ? 'Quotation sent to client' : 'Quotation approved',
        { description: acting.quoteNumber },
      );
    } catch (error) {
      toast.error(
        kind === 'send'
          ? 'Could not send quotation'
          : 'Could not approve quotation',
        { description: getApiErrorMessage(error) },
      );
    } finally {
      setActing(null);
    }
  };

  const columns = useMemo(
    () =>
      buildColumns({
        onRevise: (quotation) => {
          setRevising(quotation);
          setReviseReason('');
        },
        onReject: (quotation) => {
          setRejecting(quotation);
          setRejectReason('');
        },
        onSend: setActing,
        onApprove: setActing,
      }),
    [],
  );

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  const totalValue = quotations.reduce((s, q) => s + (q.totalAmount ?? 0), 0);
  const pending = quotations.filter(
    (q) => q.status === 'DRAFT' || q.status === 'INTERNAL_REVIEW',
  ).length;
  const accepted = quotations.filter((q) => q.status === 'ACCEPTED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Quotations"
        description="Versioned commercial proposals with technical scope, line items, approvals and client issue history."
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
              New Quotation
            </Button>
          </div>
        }
      />

      {/* KPI Strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          {
            label: 'Total Quotations',
            value: quotations.length,
            color: 'text-foreground',
          },
          {
            label: 'Total Value',
            value: formatCurrency(totalValue, 'USD', true),
            color: 'text-teal-600 dark:text-teal-400',
          },
          {
            label: 'Pending Approval',
            value: pending,
            color: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Accepted',
            value: accepted,
            color: 'text-emerald-600 dark:text-emerald-400',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </motion.div>

      {quotations.length === 0 ? (
        <EmptyState
          icon={<FileCheck className="h-6 w-6" />}
          title="No quotations yet"
          description="Quotations appear here once created from an RFQ or client request."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              New Quotation
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={quotations}
          searchColumn="title"
          searchPlaceholder="Search quotations…"
        />
      )}

      {/* New Quotation Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (createQuotation.isPending) return;
          setDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Quotation</DialogTitle>
            <DialogDescription>
              Create a commercial quotation with scope, line items and pricing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
            <div className="grid gap-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="quote-title">Quotation title *</Label>
                <Input
                  id="quote-title"
                  placeholder="CIP Plant Equipment Package — Phase 1"
                  {...register('title')}
                  error={errors.title?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="quote-client">Client</Label>
                  <select
                    id="quote-client"
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
                  <Label htmlFor="quote-rfq">Responds to RFQ</Label>
                  <select
                    id="quote-rfq"
                    className={selectClass}
                    {...register('rfqId')}
                  >
                    <option value="">Not from an RFQ</option>
                    {rfqOptions.map((rfq) => (
                      <option key={rfq.id} value={rfq.id}>
                        {rfq.rfqNumber ? `${rfq.rfqNumber} — ` : ''}
                        {rfq.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="quote-currency">Currency</Label>
                  <select
                    id="quote-currency"
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
                  <Label htmlFor="quote-tax">Tax rate %</Label>
                  <Input
                    id="quote-tax"
                    type="number"
                    min={0}
                    step="0.01"
                    {...register('taxRate')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quote-valid">Valid until</Label>
                  <Input
                    id="quote-valid"
                    type="date"
                    {...register('validUntil')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quote-description">Scope of work</Label>
                <Textarea
                  id="quote-description"
                  rows={3}
                  className="min-h-[80px]"
                  placeholder="Technical and commercial scope…"
                  {...register('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="quote-delivery">Delivery terms</Label>
                  <Input
                    id="quote-delivery"
                    placeholder="DAP Bondo, 12 weeks"
                    {...register('deliveryTerms')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quote-payment">Payment terms</Label>
                  <Input
                    id="quote-payment"
                    placeholder="40% advance, 60% on delivery"
                    {...register('paymentTerms')}
                  />
                </div>
              </div>

              {/* Line items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Line items *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={() => append({ ...EMPTY_LINE })}
                  >
                    Add item
                  </Button>
                </div>
                {errors.lineItems?.message && (
                  <p className="text-xs font-medium text-destructive" role="alert">
                    {errors.lineItems.message}
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
                      {...register(`lineItems.${index}.description`)}
                      error={errors.lineItems?.[index]?.description?.message}
                    />
                    <div className="grid grid-cols-4 gap-3">
                      <Input
                        type="number"
                        step="0.01"
                        min={0.01}
                        placeholder="Qty *"
                        {...register(`lineItems.${index}.quantity`)}
                        error={errors.lineItems?.[index]?.quantity?.message}
                      />
                      <Input
                        placeholder="Unit"
                        {...register(`lineItems.${index}.unit`)}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="Unit price *"
                        {...register(`lineItems.${index}.unitPrice`)}
                        error={errors.lineItems?.[index]?.unitPrice?.message}
                      />
                      <Input
                        type="number"
                        min={0}
                        placeholder="Lead days"
                        {...register(`lineItems.${index}.leadTimeDays`)}
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
                disabled={createQuotation.isPending}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="brand"
                loading={createQuotation.isPending}
              >
                Create Quotation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Revise (the backend's stand-in for editing a quotation) */}
      <Dialog
        open={!!revising}
        onOpenChange={(open) => {
          if (reviseQuotation.isPending) return;
          if (!open) setRevising(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revise {revising?.quoteNumber}</DialogTitle>
            <DialogDescription>
              Quotations are immutable once issued. Revising snapshots the
              current version and reopens it as a DRAFT you can edit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="revise-reason">Reason for revision</Label>
              <Textarea
                id="revise-reason"
                rows={3}
                className="min-h-[80px]"
                placeholder="Client requested a change to tank sizing…"
                value={reviseReason}
                onChange={(event) => setReviseReason(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={reviseQuotation.isPending}
              onClick={() => setRevising(null)}
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              loading={reviseQuotation.isPending}
              onClick={() => void confirmRevise()}
            >
              Create Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject — the terminal action; there is no DELETE for quotations */}
      <Dialog
        open={!!rejecting}
        onOpenChange={(open) => {
          if (rejectQuotation.isPending) return;
          if (!open) setRejecting(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject {rejecting?.quoteNumber}?</DialogTitle>
            <DialogDescription>
              The quotation stays on record for audit but is closed as REJECTED.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="reject-reason">Reason</Label>
              <Textarea
                id="reject-reason"
                rows={3}
                className="min-h-[80px]"
                placeholder="Client awarded to another supplier…"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={rejectQuotation.isPending}
              onClick={() => setRejecting(null)}
            >
              Keep quotation
            </Button>
            <Button
              variant="destructive"
              loading={rejectQuotation.isPending}
              onClick={() => void confirmReject()}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve / send confirmation */}
      <Dialog
        open={!!acting}
        onOpenChange={(open) => {
          if (sendQuotation.isPending || approveQuotation.isPending) return;
          if (!open) setActing(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{acting?.quoteNumber}</DialogTitle>
            <DialogDescription>
              Approve the quotation internally, or send the approved quotation
              to the client.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={sendQuotation.isPending || approveQuotation.isPending}
              onClick={() => setActing(null)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              loading={approveQuotation.isPending}
              onClick={() => void runAction('approve')}
            >
              Approve
            </Button>
            <Button
              variant="brand"
              loading={sendQuotation.isPending}
              onClick={() => void runAction('send')}
            >
              Send to client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
