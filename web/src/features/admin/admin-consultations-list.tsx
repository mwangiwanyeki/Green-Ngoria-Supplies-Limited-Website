'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  ClipboardList,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  MapPin,
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
import { useMe } from '@/lib/api/hooks/use-auth';
import { useLeads } from '@/lib/api/hooks/use-leads';
import {
  useConsultationsForLeads,
  useCreateConsultation,
  useMarkConsultationComplete,
  type ConsultationRow,
} from '@/lib/api/hooks/use-consultations';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { compact, toIsoDate } from '@/lib/api/payload';
import { formatDate } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface LeadOption {
  id: string;
  reference: string;
  companyName: string;
  contactName: string;
  _count?: { consultations: number };
}

/** Matches the documented `type` values on `CreateConsultationDto`. */
const CONSULTATION_TYPES = [
  'INITIAL',
  'TECHNICAL',
  'FOLLOW_UP',
  'SITE_VISIT',
] as const;

const selectClass =
  'h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/**
 * Mirrors `CreateConsultationDto` — `scheduledAt` (`@IsDate()`) and `type`
 * (`@IsNotEmpty()`) are required; the rest are `@IsOptional()` strings.
 */
const consultationSchema = z.object({
  leadId: z.string().uuid('Select the lead this consultation belongs to'),
  scheduledAt: z.string().min(1, 'Pick a date and time'),
  type: z.string().min(1, 'Select a consultation type'),
  location: z.string().optional(),
  notes: z.string().optional(),
  nextSteps: z.string().optional(),
});

type ConsultationFormValues = z.infer<typeof consultationSchema>;

const EMPTY_CONSULTATION: ConsultationFormValues = {
  leadId: '',
  scheduledAt: '',
  type: 'INITIAL',
  location: '',
  notes: '',
  nextSteps: '',
};

function RowActions({
  item,
  orgId: propOrgId,
}: {
  item: ConsultationRow;
  orgId?: string;
}) {
  const { data: me } = useMe();
  const orgId = propOrgId ?? me?.organizationId ?? '';
  const markComplete = useMarkConsultationComplete(orgId);
  const isPending = markComplete.isPending;

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
              href={`/admin/leads/${item.leadId}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            >
              <Eye className="h-3.5 w-3.5" /> Open parent lead
            </Link>
          </DropdownMenu.Item>
          {!item.completedAt && (
            <DropdownMenu.Item
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-success outline-none cursor-pointer hover:bg-success/10"
              disabled={isPending}
              onSelect={() => {
                void markComplete.mutateAsync(
                  { leadId: item.leadId, consultationId: item.id },
                  {
                    onSuccess: () => toast.success('Consultation marked complete'),
                    onError: (err) =>
                      toast.error(getApiErrorMessage(err, 'Could not update consultation')),
                  },
                );
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isPending ? 'Saving…' : 'Mark complete'}
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function buildColumns(orgId: string): ColumnDef<ConsultationRow>[] {
  return [
    {
      accessorKey: 'leadReference',
      header: 'Lead Ref',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.leadReference}
        </span>
      ),
    },
    {
      accessorKey: 'leadCompanyName',
      header: 'Client / Prospect',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.leadCompanyName}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.leadContactName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Session Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.type.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'scheduledAt',
      header: 'Scheduled',
      cell: ({ row }) => (
        <span className="text-xs font-medium">
          {formatDate(row.original.scheduledAt)}
        </span>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) =>
        row.original.location ? (
          <span className="flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            {row.original.location}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Virtual / Remote</span>
        ),
    },
    {
      id: 'completion',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.completedAt ? 'success' : 'warning'}>
          {row.original.completedAt ? 'Completed' : 'Scheduled'}
        </Badge>
      ),
    },
    {
      accessorKey: 'outcome',
      header: 'Outcome',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground truncate max-w-[180px] block">
          {row.original.outcome ?? '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <RowActions item={row.original} orgId={orgId} />,
    },
  ];
}

export function AdminConsultationsList() {
  const { data: me } = useMe();
  const orgId = me?.organizationId ?? '';

  const {
    data: leadsResponse,
    isLoading: leadsLoading,
    isError: leadsError,
    refetch: refetchLeads,
  } = useLeads<LeadOption>(orgId, { limit: 200 });
  const leads = leadsResponse?.data ?? [];

  // Only leads that report at least one consultation need a detail fetch.
  const leadIdsWithConsultations = useMemo(
    () =>
      leads
        .filter((lead) => (lead._count?.consultations ?? 0) > 0)
        .map((lead) => lead.id),
    [leads],
  );

  const {
    data: items,
    isLoading: detailsLoading,
    isError: detailsError,
    refetch: refetchDetails,
  } = useConsultationsForLeads(orgId, leadIdsWithConsultations);

  const [dialogOpen, setDialogOpen] = useState(false);
  const createConsultation = useCreateConsultation(orgId);

  const columns = useMemo(() => buildColumns(orgId), [orgId]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationSchema),
    defaultValues: EMPTY_CONSULTATION,
  });

  const onSubmit = async (values: ConsultationFormValues) => {
    try {
      await createConsultation.mutateAsync({
        leadId: values.leadId,
        data: compact({
          scheduledAt: toIsoDate(values.scheduledAt),
          type: values.type,
          location: values.location,
          notes: values.notes,
          nextSteps: values.nextSteps,
        }),
      });
      toast.success('Consultation scheduled', {
        description: formatDate(values.scheduledAt),
      });
      setDialogOpen(false);
      reset(EMPTY_CONSULTATION);
    } catch (error) {
      toast.error('Could not schedule consultation', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const openCreate = () => {
    reset(EMPTY_CONSULTATION);
    setDialogOpen(true);
  };

  const handleExport = () => {
    if (!items.length) { toast.error('No data to export'); return; }
    const headers = ['Lead Ref', 'Company', 'Contact', 'Type', 'Scheduled', 'Location', 'Status', 'Outcome'];
    const csv = [
      headers.join(','),
      ...items.map((c) => [
        c.leadReference,
        c.leadCompanyName,
        c.leadContactName,
        c.type,
        formatDate(c.scheduledAt),
        c.location ?? '',
        c.completedAt ? 'Completed' : 'Scheduled',
        c.outcome ?? '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export ready');
  };

  if (leadsLoading || detailsLoading) return <PageSkeleton />;
  if (leadsError || detailsError) {
    return (
      <ErrorState
        retry={() => {
          void refetchLeads();
          void refetchDetails();
        }}
      />
    );
  }

  const saving = createConsultation.isPending;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Technical Consultations"
        description="Structured consultation records that convert qualified leads into assessable technical opportunities."
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
              Schedule Consultation
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
          { label: 'Total Consultations', value: items.length },
          {
            label: 'Upcoming',
            value: items.filter((c) => !c.completedAt).length,
          },
          {
            label: 'Completed',
            value: items.filter((c) => !!c.completedAt).length,
          },
          {
            label: 'Site Visits',
            value: items.filter((c) => c.type === 'SITE_VISIT').length,
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
          icon={<ClipboardList className="h-6 w-6" />}
          title="No consultations recorded"
          description="Schedule preliminary technical sessions with prospective mining clients."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Schedule Consultation
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          searchColumn="leadCompanyName"
          searchPlaceholder="Search by client or site name…"
        />
      )}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (saving) return;
          setDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Technical Consultation</DialogTitle>
            <DialogDescription>
              Consultations attach to an existing lead. Record the session
              context, objectives, and meeting location.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
          >
            <div className="grid gap-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="consultation-lead">Lead *</Label>
                <select
                  id="consultation-lead"
                  className={selectClass}
                  {...register('leadId')}
                >
                  <option value="">Select a lead…</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.reference} — {lead.companyName}
                    </option>
                  ))}
                </select>
                {errors.leadId && (
                  <p
                    className="text-xs font-medium text-destructive"
                    role="alert"
                  >
                    {errors.leadId.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="consultation-when">Date & time *</Label>
                  <Input
                    id="consultation-when"
                    type="datetime-local"
                    {...register('scheduledAt')}
                    error={errors.scheduledAt?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="consultation-type">Session type *</Label>
                  <select
                    id="consultation-type"
                    className={selectClass}
                    {...register('type')}
                  >
                    {CONSULTATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="consultation-location">
                  Location / meeting link
                </Label>
                <Input
                  id="consultation-location"
                  placeholder="Bondo site office, or a video call link"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  {...register('location')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="consultation-notes">Objectives / notes</Label>
                <Textarea
                  id="consultation-notes"
                  rows={3}
                  className="min-h-[80px]"
                  placeholder="Session objectives, ore sample details, technical questions…"
                  {...register('notes')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="consultation-next">Next steps</Label>
                <Input
                  id="consultation-next"
                  placeholder="Prepare a bench-scale test proposal"
                  {...register('nextSteps')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" loading={saving}>
                Save Consultation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
