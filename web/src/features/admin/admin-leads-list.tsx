'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Users,
  Plus,
  Phone,
  Mail,
  Building2,
  ArrowRight,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Download,
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
  useLeads,
  useCreateLead,
  useUpdateLead,
} from '@/lib/api/hooks/use-leads';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { compact } from '@/lib/api/payload';
import { formatRelativeDate, formatCurrency } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  reference: string;
  contactName: string;
  companyName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  country: string | null;
  source: string | null;
  status: string;
  estimatedValue: number | string | null;
  currency: string;
  mineralType: string | null;
  miningLocation: string | null;
  projectDescription: string | null;
  priority: string | null;
  owner?: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
}

/** Matches `LeadStatus` in prisma/schema.prisma. */
const PIPELINE_STAGES = [
  'NEW',
  'QUALIFIED',
  'CONSULTATION',
  'ASSESSMENT',
  'RFQ',
  'QUOTATION',
  'NEGOTIATION',
  'WON',
  'LOST',
];

/** Matches `LeadSource` in prisma/schema.prisma. */
const LEAD_SOURCES = [
  'WEBSITE',
  'REFERRAL',
  'EXHIBITION',
  'COLD_OUTREACH',
  'SOCIAL_MEDIA',
  'PARTNER',
  'REPEAT_CLIENT',
  'OTHER',
] as const;

/** Matches `MineralType` in prisma/schema.prisma. */
const MINERAL_TYPES = [
  'GOLD',
  'SILVER',
  'COPPER',
  'LEAD',
  'ZINC',
  'IRON',
  'MANGANESE',
  'CHROMITE',
  'TITANIUM',
  'COBALT',
  'NICKEL',
  'DIAMONDS',
  'GEMSTONES',
  'COAL',
  'OTHER',
] as const;

/** Matches `Currency` in prisma/schema.prisma. */
const CURRENCIES = ['USD', 'KES', 'TZS', 'UGX', 'RWF', 'EUR', 'GBP'] as const;

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

/** Mirror of server-side PIPELINE_TRANSITIONS for the "Change stage" select. */
const PIPELINE_TRANSITIONS: Record<string, string[]> = {
  NEW:          ['QUALIFIED', 'LOST', 'INACTIVE'],
  QUALIFIED:    ['CONSULTATION', 'LOST', 'INACTIVE'],
  CONSULTATION: ['ASSESSMENT', 'QUALIFIED', 'LOST'],
  ASSESSMENT:   ['RFQ', 'CONSULTATION', 'LOST'],
  RFQ:          ['QUOTATION', 'ASSESSMENT', 'LOST'],
  QUOTATION:    ['NEGOTIATION', 'RFQ', 'LOST'],
  NEGOTIATION:  ['WON', 'LOST', 'QUOTATION'],
  WON:          [],
  LOST:         ['NEW'],
  INACTIVE:     ['NEW'],
};

const PIPELINE_COLORS: Record<string, string> = {
  NEW: 'bg-sky-500',
  QUALIFIED: 'bg-teal-500',
  CONSULTATION: 'bg-amber-500',
  ASSESSMENT: 'bg-orange-500',
  RFQ: 'bg-indigo-500',
  QUOTATION: 'bg-violet-500',
  NEGOTIATION: 'bg-pink-500',
  WON: 'bg-emerald-500',
  LOST: 'bg-red-500',
};

const selectClass =
  'h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/**
 * Mirrors `CreateLeadDto` — `companyName` and `contactName` are the only
 * `@IsNotEmpty()` fields; every other property is `@IsOptional()` and must be
 * omitted rather than sent blank (`@IsEmail()` rejects `''`).
 */
const leadSchema = z.object({
  companyName: z.string().trim().min(2, 'Company name is required'),
  contactName: z.string().trim().min(2, 'Contact name is required'),
  contactEmail: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .optional()
    .or(z.literal('')),
  contactPhone: z.string().optional(),
  country: z.string().optional(),
  source: z.string().optional(),
  mineralType: z.string().optional(),
  miningLocation: z.string().optional(),
  projectDescription: z.string().optional(),
  estimatedValue: z.string().optional(),
  currency: z.string().optional(),
  priority: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

const EMPTY_LEAD: LeadFormValues = {
  companyName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  country: 'Kenya',
  source: 'WEBSITE',
  mineralType: '',
  miningLocation: '',
  projectDescription: '',
  estimatedValue: '',
  currency: 'USD',
  priority: 'MEDIUM',
};

function toPayload(values: LeadFormValues) {
  const estimatedValue = Number(values.estimatedValue);
  return compact({
    companyName: values.companyName.trim(),
    contactName: values.contactName.trim(),
    contactEmail: values.contactEmail,
    contactPhone: values.contactPhone,
    country: values.country,
    source: values.source,
    mineralType: values.mineralType,
    miningLocation: values.miningLocation,
    projectDescription: values.projectDescription,
    estimatedValue: values.estimatedValue ? estimatedValue : undefined,
    currency: values.currency,
    priority: values.priority,
  });
}

function PipelineIndicator({ status }: { status: string }) {
  const currentIdx = PIPELINE_STAGES.indexOf(status);
  return (
    <div className="flex items-center gap-0.5">
      {PIPELINE_STAGES.slice(0, 7).map((stage, i) => (
        <div
          key={stage}
          className={cn(
            'h-1.5 w-4 rounded-full transition-colors',
            i <= currentIdx
              ? (PIPELINE_COLORS[status] ?? 'bg-muted-foreground')
              : 'bg-muted',
          )}
          title={stage.replace(/_/g, ' ')}
        />
      ))}
    </div>
  );
}

interface RowHandlers {
  onEdit: (lead: Lead) => void;
  onAdvance: (lead: Lead) => void;
  onArchive: (lead: Lead) => void;
}

function RowActions({ lead, handlers }: { lead: Lead; handlers: RowHandlers }) {
  const isClosed = lead.status === 'WON' || lead.status === 'LOST';
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
              href={`/admin/leads/${lead.id}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            >
              <Eye className="h-3.5 w-3.5" /> View details
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onEdit(lead)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit lead
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onAdvance(lead)}
          >
            <ArrowRight className="h-3.5 w-3.5" /> Change stage
          </DropdownMenu.Item>
          {!isClosed && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive outline-none cursor-pointer hover:bg-destructive/10"
                onSelect={() => handlers.onArchive(lead)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Archive lead
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function buildColumns(handlers: RowHandlers): ColumnDef<Lead>[] {
  return [
    {
      accessorKey: 'reference',
      header: 'Reference',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.reference}
        </span>
      ),
    },
    {
      accessorKey: 'contactName',
      header: 'Contact',
      cell: ({ row }) => (
        <Link
          href={`/admin/leads/${row.original.id}`}
          className="font-medium hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        >
          {row.original.contactName}
        </Link>
      ),
    },
    {
      accessorKey: 'companyName',
      header: 'Company',
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          {row.original.companyName || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Pipeline',
      cell: ({ row }) => (
        <div className="space-y-1.5">
          <StatusBadge status={row.original.status} />
          <PipelineIndicator status={row.original.status} />
        </div>
      ),
    },
    {
      accessorKey: 'estimatedValue',
      header: 'Est. Value',
      cell: ({ row }) =>
        row.original.estimatedValue ? (
          <span className="font-semibold text-teal-600 dark:text-teal-400 tabular-nums">
            {formatCurrency(
              Number(row.original.estimatedValue),
              row.original.currency || 'USD',
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'owner',
      header: 'Owner',
      cell: ({ row }) =>
        row.original.owner
          ? `${row.original.owner.firstName} ${row.original.owner.lastName}`
          : 'Unassigned',
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
      cell: ({ row }) => <RowActions lead={row.original} handlers={handlers} />,
    },
  ];
}

export function AdminLeadsList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useLeads(orgId);
  const leads = (data?.data ?? []) as unknown as Lead[];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [archiving, setArchiving] = useState<Lead | null>(null);
  const [advancing, setAdvancing] = useState<Lead | null>(null);
  const [nextStage, setNextStage] = useState('');

  const createLead = useCreateLead(orgId);
  const updateLead = useUpdateLead(orgId, editing?.id ?? '');
  const archiveLead = useUpdateLead(orgId, archiving?.id ?? '');
  const advanceLead = useUpdateLead(orgId, advancing?.id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: EMPTY_LEAD,
  });

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_LEAD);
    setDialogOpen(true);
  };

  // ── Export ──
  const handleExport = () => {
    if (!leads.length) { toast.error('No data to export'); return; }
    const headers = ['Reference', 'Company', 'Contact', 'Email', 'Phone', 'Country', 'Source', 'Status', 'Priority', 'Mineral', 'Est. Value', 'Currency', 'Created'];
    const csv = [headers.join(','), ...leads.map((l) => [
      l.reference, l.companyName, l.contactName, l.contactEmail ?? '',
      l.contactPhone ?? '', l.country ?? '', l.source ?? '', l.status,
      l.priority ?? '', l.mineralType ?? '',
      l.estimatedValue != null ? Number(l.estimatedValue).toFixed(2) : '',
      l.currency, formatRelativeDate(l.createdAt),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Export ready');
  };

  const openEdit = (lead: Lead) => {
    setEditing(lead);
    reset({
      companyName: lead.companyName ?? '',
      contactName: lead.contactName ?? '',
      contactEmail: lead.contactEmail ?? '',
      contactPhone: lead.contactPhone ?? '',
      country: lead.country ?? 'Kenya',
      source: lead.source ?? 'WEBSITE',
      mineralType: lead.mineralType ?? '',
      miningLocation: lead.miningLocation ?? '',
      projectDescription: lead.projectDescription ?? '',
      estimatedValue:
        lead.estimatedValue != null ? String(lead.estimatedValue) : '',
      currency: lead.currency ?? 'USD',
      priority: lead.priority ?? 'MEDIUM',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: LeadFormValues) => {
    const payload = toPayload(values);
    try {
      if (editing) {
        await updateLead.mutateAsync(payload);
        toast.success('Lead updated', { description: values.companyName });
      } else {
        await createLead.mutateAsync(payload);
        toast.success('Lead created', { description: values.companyName });
      }
      setDialogOpen(false);
      setEditing(null);
      reset(EMPTY_LEAD);
    } catch (error) {
      toast.error(editing ? 'Could not update lead' : 'Could not create lead', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmArchive = async () => {
    if (!archiving) return;
    try {
      await archiveLead.mutateAsync({ status: 'INACTIVE' });
      toast.success('Lead archived', { description: archiving.companyName });
      setArchiving(null);
    } catch (error) {
      toast.error('Could not archive lead', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmAdvance = async () => {
    if (!advancing || !nextStage) return;
    try {
      await advanceLead.mutateAsync({ status: nextStage });
      toast.success(`Lead moved to ${nextStage.replace(/_/g, ' ')}`, {
        description: advancing.companyName,
      });
      setAdvancing(null);
      setNextStage('');
    } catch (error) {
      toast.error('Could not change lead stage', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const columns = useMemo(
    () =>
      buildColumns({
        onEdit: openEdit,
        onAdvance: (lead) => {
          setAdvancing(lead);
          const idx = PIPELINE_STAGES.indexOf(lead.status);
          setNextStage(PIPELINE_STAGES[idx + 1] ?? '');
        },
        onArchive: setArchiving,
      }),
    // openEdit only closes over stable setters and `reset`.
    [],
  );

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  const saving = createLead.isPending || updateLead.isPending;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Leads & Opportunities"
        description="Qualified mining, plant, equipment and investor opportunities connected to consultation and follow-up."
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
              Add Lead
            </Button>
          </div>
        }
      />

      {/* Pipeline Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-3"
      >
        {PIPELINE_STAGES.map((stage) => {
          const count = leads.filter((l) => l.status === stage).length;
          return (
            <div
              key={stage}
              className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2"
            >
              <span
                className={cn('h-2 w-2 rounded-full', PIPELINE_COLORS[stage])}
              />
              <span className="text-xs font-medium">
                {stage.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-bold tabular-nums">{count}</span>
            </div>
          );
        })}
      </motion.div>

      {leads.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No leads yet"
          description="Leads appear here once created through the CRM or contact form."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Add Lead
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={leads}
          searchColumn="contactName"
          searchPlaceholder="Search leads…"
        />
      )}

      {/* Create / Edit Lead Dialog */}
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
            <DialogTitle>{editing ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the commercial details captured for this opportunity.'
                : 'Create a qualified lead from a contact, referral, or inbound enquiry.'}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
          >
            <div className="grid gap-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="lead-company">Company name *</Label>
                <Input
                  id="lead-company"
                  placeholder="Bondo Alluvial Gold Ltd"
                  leftIcon={<Building2 className="h-4 w-4" />}
                  {...register('companyName')}
                  error={errors.companyName?.message}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lead-contact">Contact name *</Label>
                <Input
                  id="lead-contact"
                  placeholder="James Otieno"
                  {...register('contactName')}
                  error={errors.contactName?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="lead-email">Email address</Label>
                  <Input
                    id="lead-email"
                    type="email"
                    placeholder="james@example.com"
                    leftIcon={<Mail className="h-4 w-4" />}
                    {...register('contactEmail')}
                    error={errors.contactEmail?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-phone">Phone number</Label>
                  <Input
                    id="lead-phone"
                    placeholder="+254 700 000 000"
                    leftIcon={<Phone className="h-4 w-4" />}
                    {...register('contactPhone')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="lead-source">Source</Label>
                  <select
                    id="lead-source"
                    className={selectClass}
                    {...register('source')}
                  >
                    {LEAD_SOURCES.map((source) => (
                      <option key={source} value={source}>
                        {source.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-priority">Priority</Label>
                  <select
                    id="lead-priority"
                    className={selectClass}
                    {...register('priority')}
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="lead-mineral">Mineral</Label>
                  <select
                    id="lead-mineral"
                    className={selectClass}
                    {...register('mineralType')}
                  >
                    <option value="">Not specified</option>
                    {MINERAL_TYPES.map((mineral) => (
                      <option key={mineral} value={mineral}>
                        {mineral}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-country">Country</Label>
                  <Input
                    id="lead-country"
                    placeholder="Kenya"
                    {...register('country')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lead-location">Mining location</Label>
                <Input
                  id="lead-location"
                  placeholder="Siaya County, Nyangoma block"
                  {...register('miningLocation')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="lead-value">Estimated value</Label>
                  <Input
                    id="lead-value"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    {...register('estimatedValue')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-currency">Currency</Label>
                  <select
                    id="lead-currency"
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
                <Label htmlFor="lead-description">Project description</Label>
                <Textarea
                  id="lead-description"
                  rows={3}
                  className="min-h-[80px]"
                  placeholder="Ore type, tonnage, plant requirement…"
                  {...register('projectDescription')}
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
                {editing ? 'Save Changes' : 'Create Lead'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change pipeline stage */}
      <Dialog
        open={!!advancing}
        onOpenChange={(open) => {
          if (advanceLead.isPending) return;
          if (!open) {
            setAdvancing(null);
            setNextStage('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change pipeline stage</DialogTitle>
            <DialogDescription>
              {advancing?.companyName} is currently at{' '}
              {advancing?.status.replace(/_/g, ' ')}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="lead-next-stage">Move to</Label>
              <select
                id="lead-next-stage"
                className={selectClass}
                value={nextStage}
                onChange={(event) => setNextStage(event.target.value)}
              >
                <option value="">Select stage…</option>
                {(PIPELINE_TRANSITIONS[advancing?.status as keyof typeof PIPELINE_TRANSITIONS] ?? PIPELINE_STAGES).map((stage) => (
                  <option key={stage} value={stage}>
                    {stage.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={advanceLead.isPending}
              onClick={() => {
                setAdvancing(null);
                setNextStage('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              disabled={!nextStage}
              loading={advanceLead.isPending}
              onClick={() => void confirmAdvance()}
            >
              Update stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
        title="Archive this lead?"
        description={
          <>
            {archiving?.companyName} will be moved to INACTIVE and drop out of
            the active pipeline. Its activities and consultations are kept.
          </>
        }
        confirmLabel="Archive lead"
        cancelLabel="Keep lead"
        loading={archiveLead.isPending}
        onConfirm={() => void confirmArchive()}
      />
    </div>
  );
}
