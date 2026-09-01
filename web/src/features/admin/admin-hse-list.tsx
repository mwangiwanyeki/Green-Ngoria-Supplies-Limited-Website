'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  HardHat,
  Plus,
  MoreHorizontal,
  CheckCircle2,
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
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useHseIncidents,
  useCreateHseIncident,
  useCloseIncident,
} from '@/lib/api/hooks/use-hse';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import {
  FormDialog,
  TextField,
  TextAreaField,
  SelectField,
  CheckboxField,
  apiErrorMessage,
  buildPayload,
  optionalDate,
  enumOptions,
  confirmAction,
  rowMenuContentClass,
  rowMenuItemClass,
} from './_form-kit';

interface HseIncidentRow {
  id: string;
  title: string;
  severity: string;
  incidentDate: string;
  location: string | null;
  isReportable: boolean;
  closedAt: string | null;
  createdAt: string;
}

/** Mirrors the HseIncidentSeverity enum in prisma/schema.prisma. */
const SEVERITIES = [
  'NEAR_MISS',
  'FIRST_AID',
  'MEDICAL_TREATMENT',
  'LOST_TIME',
  'FATALITY',
  'ENVIRONMENTAL',
  'PROPERTY_DAMAGE',
] as const;

const SEVERITY_VARIANT: Record<string, 'warning' | 'destructive'> = {
  NEAR_MISS: 'warning',
  FIRST_AID: 'warning',
  MEDICAL_TREATMENT: 'destructive',
  LOST_TIME: 'destructive',
  FATALITY: 'destructive',
  ENVIRONMENTAL: 'warning',
  PROPERTY_DAMAGE: 'warning',
};

// ─── Create form ───────────────────────────────────────────────────────────

interface IncidentForm {
  title: string;
  description: string;
  incidentDate: string;
  severity: string;
  location: string;
  injuredParty: string;
  rootCause: string;
  immediateAction: string;
  correctiveAction: string;
  isReportable: boolean;
}

const EMPTY_FORM: IncidentForm = {
  title: '',
  description: '',
  incidentDate: '',
  severity: 'NEAR_MISS',
  location: '',
  injuredParty: '',
  rootCause: '',
  immediateAction: '',
  correctiveAction: '',
  isReportable: false,
};

/** Client-side mirror of CreateHseIncidentDto's @IsNotEmpty fields. */
function validate(form: IncidentForm): Partial<Record<keyof IncidentForm, string>> {
  const errors: Partial<Record<keyof IncidentForm, string>> = {};
  if (!form.title.trim()) errors.title = 'Title is required.';
  if (!form.description.trim())
    errors.description = 'Description is required.';
  if (!form.incidentDate.trim())
    errors.incidentDate = 'Incident date is required.';
  if (!form.severity) errors.severity = 'Severity is required.';
  return errors;
}

function ReportIncidentDialog({
  open,
  onOpenChange,
  orgId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}) {
  const [form, setForm] = useState<IncidentForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof IncidentForm, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createIncident = useCreateHseIncident(orgId);

  const set = <K extends keyof IncidentForm>(key: K, value: IncidentForm[K]) => {
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

    createIncident.mutate(
      buildPayload({
        title: form.title,
        description: form.description,
        incidentDate: optionalDate(form.incidentDate),
        severity: form.severity,
        location: form.location,
        injuredParty: form.injuredParty,
        rootCause: form.rootCause,
        immediateAction: form.immediateAction,
        correctiveAction: form.correctiveAction,
        isReportable: form.isReportable,
      }),
      {
        onSuccess: () => {
          toast.success('Incident reported');
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
      title="Report an HSE incident"
      description="Capture the incident facts now; root cause and corrective actions can be added as the investigation progresses."
      submitLabel="Report incident"
      onSubmit={handleSubmit}
      pending={createIncident.isPending}
      error={submitError}
    >
      <TextField
        label="Title"
        required
        value={form.title}
        error={errors.title}
        placeholder="Conveyor guard contact — CV-102"
        onChange={(v) => set('title', v)}
      />
      <TextAreaField
        label="Description"
        required
        value={form.description}
        error={errors.description}
        placeholder="What happened, who was involved, and what was the immediate outcome?"
        onChange={(v) => set('description', v)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Incident date"
          required
          type="datetime-local"
          value={form.incidentDate}
          error={errors.incidentDate}
          onChange={(v) => set('incidentDate', v)}
        />
        <SelectField
          label="Severity"
          required
          value={form.severity}
          error={errors.severity}
          options={enumOptions(SEVERITIES)}
          onChange={(v) => set('severity', v)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Location"
          value={form.location}
          placeholder="CIP circuit, Tank 3"
          onChange={(v) => set('location', v)}
        />
        <TextField
          label="Injured party"
          value={form.injuredParty}
          placeholder="Name or 'None'"
          onChange={(v) => set('injuredParty', v)}
        />
      </div>
      <TextAreaField
        label="Immediate action taken"
        value={form.immediateAction}
        rows={2}
        onChange={(v) => set('immediateAction', v)}
      />
      <TextAreaField
        label="Root cause"
        value={form.rootCause}
        rows={2}
        hint="Can be left blank until the investigation concludes."
        onChange={(v) => set('rootCause', v)}
      />
      <TextAreaField
        label="Corrective action"
        value={form.correctiveAction}
        rows={2}
        onChange={(v) => set('correctiveAction', v)}
      />
      <CheckboxField
        label="Reportable to the regulator"
        checked={form.isReportable}
        onChange={(v) => set('isReportable', v)}
      />
    </FormDialog>
  );
}

// ─── Row actions ───────────────────────────────────────────────────────────

function RowActions({
  incident,
  onClose,
  pending,
}: {
  incident: HseIncidentRow;
  onClose: (incident: HseIncidentRow) => void;
  pending: boolean;
}) {
  const alreadyClosed = Boolean(incident.closedAt);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          aria-label={`Actions for ${incident.title}`}
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
            disabled={alreadyClosed}
            onSelect={() => onClose(incident)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {alreadyClosed ? 'Already closed' : 'Close incident'}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function AdminHseList() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useHseIncidents(orgId, {
    page,
    limit: 20,
  });
  const closeIncident = useCloseIncident(orgId);

  const incidents = (data?.data as HseIncidentRow[] | undefined) ?? [];

  const handleClose = (incident: HseIncidentRow) => {
    if (
      !confirmAction(
        `Close "${incident.title}"? Closed incidents stay on the register but are no longer treated as open actions.`,
      )
    )
      return;
    closeIncident.mutate(incident.id, {
      onSuccess: () => toast.success('Incident closed'),
      onError: (err) => toast.error(apiErrorMessage(err)),
    });
  };

  const columns: ColumnDef<HseIncidentRow>[] = [
    {
      accessorKey: 'title',
      header: 'Incident',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => (
        <Badge variant={SEVERITY_VARIANT[row.original.severity] ?? 'outline'}>
          {row.original.severity.replace(/_/g, ' ').toLowerCase()}
        </Badge>
      ),
    },
    {
      accessorKey: 'incidentDate',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.incidentDate),
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => row.original.location ?? '—',
    },
    {
      id: 'reportable',
      header: 'Reportable',
      cell: ({ row }) =>
        row.original.isReportable ? (
          <Badge variant="destructive">Reportable</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) =>
        row.original.closedAt ? (
          <Badge variant="mineral">Closed</Badge>
        ) : (
          <Badge variant="brand">Open</Badge>
        ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Reported',
      cell: ({ row }) => formatRelativeDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <RowActions
          incident={row.original}
          onClose={handleClose}
          pending={
            closeIncident.isPending &&
            closeIncident.variables === row.original.id
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
        title="HSE Management"
        description="Site observations, incidents, corrective actions and auditable closure."
        actions={
          <Button
            size="sm"
            variant="brand"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setDialogOpen(true)}
          >
            Report Incident
          </Button>
        }
      />
      {incidents.length === 0 ? (
        <EmptyState
          icon={<HardHat className="h-6 w-6" />}
          title="No HSE incidents recorded"
          description="Reported incidents and observations will appear here for triage and closure."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setDialogOpen(true)}
            >
              Report Incident
            </Button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={incidents}
            searchColumn="title"
            searchPlaceholder="Search incidents…"
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
              disabled={incidents.length < 20}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}

      <ReportIncidentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        orgId={orgId}
      />
    </div>
  );
}
