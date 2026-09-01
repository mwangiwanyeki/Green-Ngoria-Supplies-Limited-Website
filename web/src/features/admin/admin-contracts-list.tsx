'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  FileSignature,
  Plus,
  MoreHorizontal,
  ArrowRight,
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
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useContracts,
  useCreateContract,
  useTransitionContractById,
} from '@/lib/api/hooks/use-contracts';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  FormDialog,
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
} from './_form-kit';

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  status: string;
  currency: string;
  value: number;
  retentionPct: number;
  paymentTerms?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  client?: { id: string; companyName: string } | null;
}

/** Mirrors the Currency enum in prisma/schema.prisma. */
const CURRENCIES = [
  'USD',
  'KES',
  'TZS',
  'UGX',
  'RWF',
  'EUR',
  'GBP',
] as const;

/**
 * The contracts controller exposes no PATCH or DELETE — the status transition
 * endpoint is the only way to advance or retire a contract.
 */
const NEXT_STATUSES: Record<string, string[]> = {
  DRAFT: ['UNDER_REVIEW', 'TERMINATED'],
  UNDER_REVIEW: ['APPROVED', 'DRAFT', 'TERMINATED'],
  APPROVED: ['SIGNED', 'TERMINATED'],
  SIGNED: ['ACTIVE', 'TERMINATED'],
  ACTIVE: ['COMPLETED', 'DISPUTED', 'TERMINATED'],
  DISPUTED: ['ACTIVE', 'TERMINATED'],
  COMPLETED: [],
  TERMINATED: [],
};

const RETIRING = new Set(['TERMINATED', 'DISPUTED']);

// ─── Create dialog ─────────────────────────────────────────────────────────

interface ContractForm {
  contractNumber: string;
  title: string;
  description: string;
  value: string;
  currency: string;
  retentionPct: string;
  paymentTerms: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: ContractForm = {
  contractNumber: '',
  title: '',
  description: '',
  value: '',
  currency: 'USD',
  retentionPct: '',
  paymentTerms: '',
  startDate: '',
  endDate: '',
};

/** Client-side mirror of CreateContractDto's required fields and @Min(0). */
function validate(
  form: ContractForm,
): Partial<Record<keyof ContractForm, string>> {
  const errors: Partial<Record<keyof ContractForm, string>> = {};
  if (!form.contractNumber.trim())
    errors.contractNumber = 'Contract number is required.';
  if (!form.title.trim()) errors.title = 'Title is required.';

  if (!form.value.trim()) {
    errors.value = 'Contract value is required.';
  } else {
    const n = Number(form.value);
    if (!Number.isFinite(n)) errors.value = 'Must be a number.';
    else if (n < 0) errors.value = 'Cannot be negative.';
  }

  if (form.retentionPct.trim()) {
    const n = Number(form.retentionPct);
    if (!Number.isFinite(n)) errors.retentionPct = 'Must be a number.';
    else if (n < 0) errors.retentionPct = 'Cannot be negative.';
  }

  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = 'End date must be on or after the start date.';
  }
  return errors;
}

function CreateContractDialog({
  open,
  onOpenChange,
  orgId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}) {
  const [form, setForm] = useState<ContractForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContractForm, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createContract = useCreateContract(orgId);

  const set = <K extends keyof ContractForm>(
    key: K,
    value: ContractForm[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setForm(EMPTY_FORM);
      setErrors({});
      setSubmitError(null);
    }
  };

  const handleSubmit = () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitError(null);

    createContract.mutate(
      buildPayload({
        contractNumber: form.contractNumber,
        title: form.title,
        description: form.description,
        value: optionalNumber(form.value),
        currency: form.currency,
        retentionPct: optionalNumber(form.retentionPct),
        paymentTerms: form.paymentTerms,
        startDate: optionalDate(form.startDate),
        endDate: optionalDate(form.endDate),
      }),
      {
        onSuccess: () => {
          toast.success('Contract created');
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
      title="Draft a contract"
      description="Contracts start as DRAFT and move through review, approval and signature via the row actions."
      submitLabel="Create contract"
      onSubmit={handleSubmit}
      pending={createContract.isPending}
      error={submitError}
    >
      <TextField
        label="Contract number"
        required
        value={form.contractNumber}
        error={errors.contractNumber}
        placeholder="GNG-CTR-2026-014"
        onChange={(v) => set('contractNumber', v)}
      />
      <TextField
        label="Title"
        required
        value={form.title}
        error={errors.title}
        placeholder="CIP plant EPC — Phase 2"
        onChange={(v) => set('title', v)}
      />
      <TextAreaField
        label="Description"
        value={form.description}
        rows={3}
        onChange={(v) => set('description', v)}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="Value"
          required
          type="number"
          value={form.value}
          error={errors.value}
          onChange={(v) => set('value', v)}
        />
        <SelectField
          label="Currency"
          value={form.currency}
          options={enumOptions(CURRENCIES)}
          onChange={(v) => set('currency', v)}
        />
        <TextField
          label="Retention %"
          type="number"
          value={form.retentionPct}
          error={errors.retentionPct}
          onChange={(v) => set('retentionPct', v)}
        />
      </div>
      <TextField
        label="Payment terms"
        value={form.paymentTerms}
        placeholder="30% advance, 60% on delivery, 10% on handover"
        onChange={(v) => set('paymentTerms', v)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Start date"
          type="date"
          value={form.startDate}
          onChange={(v) => set('startDate', v)}
        />
        <TextField
          label="End date"
          type="date"
          value={form.endDate}
          error={errors.endDate}
          onChange={(v) => set('endDate', v)}
        />
      </div>
    </FormDialog>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function AdminContractsList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useContracts<Contract>(orgId);
  const contracts = data?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const transitionContract = useTransitionContractById(orgId);

  const handleTransition = (contract: Contract, status: string) => {
    if (
      RETIRING.has(status) &&
      !confirmAction(
        `Move contract ${contract.contractNumber} to ${status}? This is a commercial state change and will be recorded in the audit log.`,
      )
    )
      return;

    transitionContract.mutate(
      { id: contract.id, status },
      {
        onSuccess: () => toast.success(`Contract moved to ${status}`),
        onError: (err) => toast.error(apiErrorMessage(err)),
      },
    );
  };

  const columns: ColumnDef<Contract>[] = [
    {
      accessorKey: 'contractNumber',
      header: 'Contract #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.contractNumber}
        </span>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      id: 'client',
      header: 'Client',
      cell: ({ row }) => row.original.client?.companyName ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) =>
        formatCurrency(row.original.value, row.original.currency),
    },
    {
      accessorKey: 'startDate',
      header: 'Start',
      cell: ({ row }) => formatDate(row.original.startDate),
    },
    {
      accessorKey: 'endDate',
      header: 'End',
      cell: ({ row }) => formatDate(row.original.endDate),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const contract = row.original;
        const next = NEXT_STATUSES[contract.status] ?? [];
        const pending =
          transitionContract.isPending &&
          transitionContract.variables?.id === contract.id;

        return (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                aria-label={`Actions for ${contract.contractNumber}`}
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
                        RETIRING.has(status)
                          ? rowMenuDestructiveItemClass
                          : rowMenuItemClass
                      }
                      onSelect={() => handleTransition(contract, status)}
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

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Contracts"
        description="Controlled commercial terms, milestones, approvals and project linkage."
        actions={
          <Button
            size="sm"
            variant="brand"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setDialogOpen(true)}
          >
            New Contract
          </Button>
        }
      />
      {contracts.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="h-6 w-6" />}
          title="No contracts yet"
          description="Contracts appear here once drafted against a client or project."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setDialogOpen(true)}
            >
              New Contract
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={contracts}
          searchColumn="title"
          searchPlaceholder="Search contracts…"
        />
      )}

      <CreateContractDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        orgId={orgId}
      />
    </div>
  );
}
