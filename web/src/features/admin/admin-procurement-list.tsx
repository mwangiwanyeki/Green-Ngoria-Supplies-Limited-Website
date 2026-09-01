'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  ClipboardList,
  Truck,
  Building2,
  Plus,
  MoreHorizontal,
  ArrowRight,
  Trash2,
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
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useRequisitions,
  useVendors,
  usePurchaseOrders,
  useCreateRequisition,
  useCreatePurchaseOrder,
  useTransitionRequisitionById,
  useUpdatePurchaseOrderStatus,
} from '@/lib/api/hooks/use-procurement';
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
  cn,
} from '@/lib/utils';
import {
  FormDialog,
  Field,
  TextField,
  TextAreaField,
  SelectField,
  apiErrorMessage,
  buildPayload,
  optionalNumber,
  optionalDate,
  enumOptions,
  confirmAction,
  rowMenuContentClass,
  rowMenuItemClass,
  rowMenuDestructiveItemClass,
  type SelectOption,
} from './_form-kit';

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


/** Mirrors the Currency enum in prisma/schema.prisma. */
const CURRENCIES = ['USD', 'KES', 'TZS', 'UGX', 'RWF', 'EUR', 'GBP'] as const;

/** The urgency values CreateRequisitionDto documents. */
const URGENCIES = ['LOW', 'NORMAL', 'URGENT', 'EMERGENCY'] as const;

/**
 * Requisitions move through ProcurementStatus. The controller exposes no
 * DELETE — CANCELLED is the terminal "remove" state.
 */
const REQUISITION_NEXT: Record<string, string[]> = {
  REQUISITION: ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'CANCELLED'],
  APPROVED: ['SUPPLIER_RFQ', 'CANCELLED'],
  SUPPLIER_RFQ: ['QUOTES_RECEIVED', 'CANCELLED'],
  QUOTES_RECEIVED: ['COMPARISON', 'CANCELLED'],
  COMPARISON: ['PO_RAISED', 'CANCELLED'],
  PO_RAISED: ['DELIVERY', 'CANCELLED'],
  DELIVERY: ['RECEIVED', 'CANCELLED'],
  RECEIVED: [],
  CANCELLED: [],
};

/** The PO states the PATCH /purchase-orders/:poId/status route documents. */
const PO_STATUSES = [
  'ACKNOWLEDGED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

// ─── Requisition dialog ────────────────────────────────────────────────────

interface RequisitionItemForm {
  description: string;
  quantity: string;
  unit: string;
  estimatedPrice: string;
}

interface RequisitionForm {
  title: string;
  description: string;
  urgency: string;
  currency: string;
  requiredByDate: string;
  notes: string;
  items: RequisitionItemForm[];
}

const EMPTY_ITEM: RequisitionItemForm = {
  description: '',
  quantity: '',
  unit: 'EA',
  estimatedPrice: '',
};

const EMPTY_REQUISITION: RequisitionForm = {
  title: '',
  description: '',
  urgency: 'NORMAL',
  currency: 'USD',
  requiredByDate: '',
  notes: '',
  items: [{ ...EMPTY_ITEM }],
};

function CreateRequisitionDialog({
  open,
  onOpenChange,
  orgId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}) {
  const [form, setForm] = useState<RequisitionForm>(EMPTY_REQUISITION);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [itemsError, setItemsError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createRequisition = useCreateRequisition(orgId);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setForm({ ...EMPTY_REQUISITION, items: [{ ...EMPTY_ITEM }] });
      setTitleError(undefined);
      setItemsError(undefined);
      setSubmitError(null);
    }
  };

  const setItem = (
    index: number,
    key: keyof RequisitionItemForm,
    value: string,
  ) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) =>
        i === index ? { ...it, [key]: value } : it,
      ),
    }));
    setItemsError(undefined);
  };

  const handleSubmit = () => {
    // Mirrors CreateRequisitionDto: title @IsNotEmpty, items is a required
    // array whose entries need a description and a quantity >= 0.01.
    let ok = true;
    if (!form.title.trim()) {
      setTitleError('Title is required.');
      ok = false;
    } else {
      setTitleError(undefined);
    }

    const items = form.items.filter(
      (it) => it.description.trim() || it.quantity.trim(),
    );
    if (items.length === 0) {
      setItemsError('Add at least one line item.');
      ok = false;
    } else if (items.some((it) => !it.description.trim())) {
      setItemsError('Every line item needs a description.');
      ok = false;
    } else if (
      items.some((it) => {
        const n = Number(it.quantity);
        return !Number.isFinite(n) || n < 0.01;
      })
    ) {
      setItemsError('Every line item needs a quantity of at least 0.01.');
      ok = false;
    } else {
      setItemsError(undefined);
    }
    if (!ok) return;
    setSubmitError(null);

    createRequisition.mutate(
      {
        ...buildPayload({
          title: form.title,
          description: form.description,
          urgency: form.urgency,
          currency: form.currency,
          requiredByDate: optionalDate(form.requiredByDate),
          notes: form.notes,
        }),
        items: items.map((it) =>
          buildPayload({
            description: it.description,
            quantity: Number(it.quantity),
            unit: it.unit,
            estimatedPrice: optionalNumber(it.estimatedPrice),
          }),
        ),
      },
      {
        onSuccess: () => {
          toast.success('Requisition raised');
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
      title="Raise a purchase requisition"
      description="Requisitions start in the REQUISITION state and move through approval, supplier RFQ and PO via the row actions."
      submitLabel="Raise requisition"
      onSubmit={handleSubmit}
      pending={createRequisition.isPending}
      error={submitError}
      className="sm:max-w-2xl"
    >
      <TextField
        label="Title"
        required
        value={form.title}
        error={titleError}
        placeholder="CIP Plant — Grinding Media Batch 3"
        onChange={(v) => {
          setForm((f) => ({ ...f, title: v }));
          setTitleError(undefined);
        }}
      />
      <TextAreaField
        label="Description"
        value={form.description}
        rows={2}
        onChange={(v) => setForm((f) => ({ ...f, description: v }))}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          label="Urgency"
          value={form.urgency}
          options={enumOptions(URGENCIES)}
          onChange={(v) => setForm((f) => ({ ...f, urgency: v }))}
        />
        <SelectField
          label="Currency"
          value={form.currency}
          options={enumOptions(CURRENCIES)}
          onChange={(v) => setForm((f) => ({ ...f, currency: v }))}
        />
        <TextField
          label="Required by"
          type="date"
          value={form.requiredByDate}
          onChange={(v) => setForm((f) => ({ ...f, requiredByDate: v }))}
        />
      </div>

      <Field label="Line items" required error={itemsError}>
        <div className="space-y-3">
          {form.items.map((item, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_5rem_4.5rem_6rem_auto]"
            >
              <input
                value={item.description}
                aria-label={`Line item ${index + 1} description`}
                placeholder="Description"
                onChange={(e) => setItem(index, 'description', e.target.value)}
                className="h-9 rounded-md border border-input bg-card px-2 text-sm"
              />
              <input
                value={item.quantity}
                type="number"
                aria-label={`Line item ${index + 1} quantity`}
                placeholder="Qty"
                onChange={(e) => setItem(index, 'quantity', e.target.value)}
                className="h-9 rounded-md border border-input bg-card px-2 text-sm"
              />
              <input
                value={item.unit}
                aria-label={`Line item ${index + 1} unit`}
                placeholder="Unit"
                onChange={(e) => setItem(index, 'unit', e.target.value)}
                className="h-9 rounded-md border border-input bg-card px-2 text-sm"
              />
              <input
                value={item.estimatedPrice}
                type="number"
                aria-label={`Line item ${index + 1} estimated price`}
                placeholder="Est. price"
                onChange={(e) =>
                  setItem(index, 'estimatedPrice', e.target.value)
                }
                className="h-9 rounded-md border border-input bg-card px-2 text-sm"
              />
              <button
                type="button"
                aria-label={`Remove line item ${index + 1}`}
                disabled={form.items.length === 1}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    items: f.items.filter((_, i) => i !== index),
                  }))
                }
                className="rounded-md p-2 text-muted-foreground hover:bg-muted disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() =>
              setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }))
            }
          >
            Add line item
          </Button>
        </div>
      </Field>

      <TextAreaField
        label="Notes"
        value={form.notes}
        rows={2}
        onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
      />
    </FormDialog>
  );
}

// ─── Purchase order dialog ─────────────────────────────────────────────────

interface PoForm {
  vendorId: string;
  totalAmount: string;
  currency: string;
  paymentTerms: string;
  deliveryAddress: string;
  expectedDelivery: string;
  notes: string;
}

const EMPTY_PO: PoForm = {
  vendorId: '',
  totalAmount: '',
  currency: 'USD',
  paymentTerms: '',
  deliveryAddress: '',
  expectedDelivery: '',
  notes: '',
};

function CreatePurchaseOrderDialog({
  open,
  onOpenChange,
  orgId,
  vendors,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  vendors: VendorRow[];
}) {
  const [form, setForm] = useState<PoForm>(EMPTY_PO);
  const [errors, setErrors] = useState<Partial<Record<keyof PoForm, string>>>(
    {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createPo = useCreatePurchaseOrder(orgId);

  const set = <K extends keyof PoForm>(key: K, value: PoForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setForm(EMPTY_PO);
      setErrors({});
      setSubmitError(null);
    }
  };

  const vendorOptions: SelectOption[] = vendors.map((v) => ({
    value: v.id,
    label: v.name,
  }));

  const handleSubmit = () => {
    // Mirrors CreatePurchaseOrderDto: vendorId is a required UUID and
    // totalAmount is a required number >= 0.
    const found: Partial<Record<keyof PoForm, string>> = {};
    if (!form.vendorId) found.vendorId = 'Select a vendor.';
    if (!form.totalAmount.trim()) {
      found.totalAmount = 'Total amount is required.';
    } else {
      const n = Number(form.totalAmount);
      if (!Number.isFinite(n)) found.totalAmount = 'Must be a number.';
      else if (n < 0) found.totalAmount = 'Cannot be negative.';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitError(null);

    createPo.mutate(
      buildPayload({
        vendorId: form.vendorId,
        totalAmount: optionalNumber(form.totalAmount),
        currency: form.currency,
        paymentTerms: form.paymentTerms,
        deliveryAddress: form.deliveryAddress,
        expectedDelivery: optionalDate(form.expectedDelivery),
        notes: form.notes,
      }),
      {
        onSuccess: () => {
          toast.success('Purchase order raised');
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
      title="Raise a purchase order"
      description="Issued against an approved vendor. Delivery status is updated from the row actions."
      submitLabel="Raise PO"
      onSubmit={handleSubmit}
      pending={createPo.isPending}
      error={submitError}
    >
      <SelectField
        label="Vendor"
        required
        value={form.vendorId}
        error={errors.vendorId}
        placeholder={
          vendors.length === 0
            ? 'No vendors registered yet'
            : 'Select a vendor…'
        }
        options={vendorOptions}
        onChange={(v) => set('vendorId', v)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Total amount"
          required
          type="number"
          value={form.totalAmount}
          error={errors.totalAmount}
          onChange={(v) => set('totalAmount', v)}
        />
        <SelectField
          label="Currency"
          value={form.currency}
          options={enumOptions(CURRENCIES)}
          onChange={(v) => set('currency', v)}
        />
      </div>
      <TextField
        label="Payment terms"
        value={form.paymentTerms}
        placeholder="Net 30"
        onChange={(v) => set('paymentTerms', v)}
      />
      <TextAreaField
        label="Delivery address"
        value={form.deliveryAddress}
        rows={2}
        onChange={(v) => set('deliveryAddress', v)}
      />
      <TextField
        label="Expected delivery"
        type="date"
        value={form.expectedDelivery}
        onChange={(v) => set('expectedDelivery', v)}
      />
      <TextAreaField
        label="Notes"
        value={form.notes}
        rows={2}
        onChange={(v) => set('notes', v)}
      />
    </FormDialog>
  );
}

function buildRequisitionColumns(
  onTransition: (req: RequisitionRow, status: string) => void,
  pendingId: string | undefined,
): ColumnDef<RequisitionRow>[] {
  return [
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
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const req = row.original;
      const next = REQUISITION_NEXT[req.status] ?? [];
      const pending = pendingId === req.id;
      return (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
              aria-label={`Actions for ${req.requisitionNo}`}
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
              {next.length === 0 ? (
                <DropdownMenu.Item className={rowMenuItemClass} disabled>
                  No further transitions
                </DropdownMenu.Item>
              ) : (
                next.map((status) => (
                  <DropdownMenu.Item
                    key={status}
                    className={
                      status === 'CANCELLED'
                        ? rowMenuDestructiveItemClass
                        : rowMenuItemClass
                    }
                    onSelect={() => onTransition(req, status)}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    Move to {status.replace(/_/g, ' ').toLowerCase()}
                  </DropdownMenu.Item>
                ))
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      );
    },
  },
  ];
}

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

function buildPoColumns(
  onUpdateStatus: (po: PurchaseOrderRow, status: string) => void,
  pendingId: string | undefined,
): ColumnDef<PurchaseOrderRow>[] {
  return [
  {
    id: 'poNumber',
    header: 'PO #',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.poNumber ?? '—'}
      </span>
    ),
  },
  {
    id: 'vendor',
    header: 'Vendor',
    cell: ({ row }) => row.original.vendor?.name ?? '—',
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) =>
      row.original.status ? (
        <StatusBadge status={row.original.status} />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
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
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const po = row.original;
      const pending = pendingId === po.id;
      return (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
              aria-label={`Actions for purchase order ${po.poNumber ?? po.id}`}
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
              {PO_STATUSES.filter((status) => status !== po.status).map(
                (status) => (
                  <DropdownMenu.Item
                    key={status}
                    className={
                      status === 'CANCELLED'
                        ? rowMenuDestructiveItemClass
                        : rowMenuItemClass
                    }
                    onSelect={() => onUpdateStatus(po, status)}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    Mark {status.toLowerCase()}
                  </DropdownMenu.Item>
                ),
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      );
    },
  },
  ];
}

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

  const [requisitionDialogOpen, setRequisitionDialogOpen] = useState(false);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const transitionRequisition = useTransitionRequisitionById(orgId);
  const updatePoStatus = useUpdatePurchaseOrderStatus(orgId);

  const handleRequisitionTransition = (
    req: RequisitionRow,
    status: string,
  ) => {
    if (
      status === 'CANCELLED' &&
      !confirmAction(
        `Cancel requisition ${req.requisitionNo}? This closes it out and cannot be undone from here.`,
      )
    )
      return;

    transitionRequisition.mutate(
      { id: req.id, status },
      {
        onSuccess: () => toast.success(`Requisition moved to ${status}`),
        onError: (err) => toast.error(apiErrorMessage(err)),
      },
    );
  };

  const handlePoStatus = (po: PurchaseOrderRow, status: string) => {
    if (
      status === 'CANCELLED' &&
      !confirmAction(
        `Cancel purchase order ${po.poNumber ?? ''}? The vendor will need a new PO to proceed.`,
      )
    )
      return;

    updatePoStatus.mutate(
      { id: po.id, status },
      {
        onSuccess: () => toast.success(`Purchase order marked ${status}`),
        onError: (err) => toast.error(apiErrorMessage(err)),
      },
    );
  };

  const requisitionColumns = buildRequisitionColumns(
    handleRequisitionTransition,
    transitionRequisition.isPending
      ? transitionRequisition.variables?.id
      : undefined,
  );
  const poColumns = buildPoColumns(
    handlePoStatus,
    updatePoStatus.isPending ? updatePoStatus.variables?.id : undefined,
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Procurement"
        description="Requisitions, supplier vendors, comparisons and purchase orders."
        actions={
          tab === 'requisitions' ? (
            <Button
              size="sm"
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setRequisitionDialogOpen(true)}
            >
              New Requisition
            </Button>
          ) : tab === 'purchase-orders' ? (
            <Button
              size="sm"
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setPoDialogOpen(true)}
            >
              New Purchase Order
            </Button>
          ) : undefined
        }
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
            action={
              <Button
                variant="brand"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setRequisitionDialogOpen(true)}
              >
                New Requisition
              </Button>
            }
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
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setPoDialogOpen(true)}
            >
              New Purchase Order
            </Button>
          }
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

      <CreateRequisitionDialog
        open={requisitionDialogOpen}
        onOpenChange={setRequisitionDialogOpen}
        orgId={orgId}
      />
      <CreatePurchaseOrderDialog
        open={poDialogOpen}
        onOpenChange={setPoDialogOpen}
        orgId={orgId}
        vendors={vendors}
      />
    </div>
  );
}
