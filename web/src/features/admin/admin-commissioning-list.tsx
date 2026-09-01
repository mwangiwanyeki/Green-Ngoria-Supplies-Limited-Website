'use client';

import { useEffect, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  ClipboardCheck,
  ListChecks,
  Plus,
  MoreHorizontal,
  FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useProjects } from '@/lib/api/hooks/use-projects';
import {
  useCommissioningSystems,
  useCommissioningProgress,
  useCreateCommissioningSystem,
  useAddTestToSystem,
} from '@/lib/api/hooks/use-commissioning';
import type { ProjectSummary } from '@/lib/api/models';
import {
  FormDialog,
  TextField,
  TextAreaField,
  apiErrorMessage,
  buildPayload,
  optionalNumber,
  rowMenuContentClass,
  rowMenuItemClass,
} from './_form-kit';

interface CommissioningTest {
  id: string;
  testNumber: string;
  title: string;
  status: string;
  result: string;
}

interface CommissioningSystem {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  tests: CommissioningTest[];
  _count?: { tests: number };
}


// ─── Create system dialog ──────────────────────────────────────────────────

interface SystemForm {
  name: string;
  description: string;
  sortOrder: string;
}

const EMPTY_SYSTEM: SystemForm = { name: '', description: '', sortOrder: '' };

function CreateSystemDialog({
  open,
  onOpenChange,
  orgId,
  projectId,
  projectLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  projectId: string;
  projectLabel: string;
}) {
  const [form, setForm] = useState<SystemForm>(EMPTY_SYSTEM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SystemForm, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createSystem = useCreateCommissioningSystem(orgId);

  const set = <K extends keyof SystemForm>(key: K, value: SystemForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setForm(EMPTY_SYSTEM);
      setErrors({});
      setSubmitError(null);
    }
  };

  const handleSubmit = () => {
    // Mirrors CreateCommissioningSystemDto: name is @IsNotEmpty, sortOrder @Min(0).
    const found: Partial<Record<keyof SystemForm, string>> = {};
    if (!form.name.trim()) found.name = 'System name is required.';
    if (form.sortOrder.trim()) {
      const n = Number(form.sortOrder);
      if (!Number.isFinite(n)) found.sortOrder = 'Must be a number.';
      else if (n < 0) found.sortOrder = 'Cannot be negative.';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitError(null);

    createSystem.mutate(
      buildPayload({
        projectId,
        name: form.name,
        description: form.description,
        sortOrder: optionalNumber(form.sortOrder),
      }),
      {
        onSuccess: () => {
          toast.success('Commissioning system created');
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
      title="Add a commissioning system"
      description={`Systems group the test plan for ${projectLabel}.`}
      submitLabel="Create system"
      onSubmit={handleSubmit}
      pending={createSystem.isPending}
      error={submitError}
    >
      <TextField
        label="System name"
        required
        value={form.name}
        error={errors.name}
        placeholder="CIP Circuit"
        onChange={(v) => set('name', v)}
      />
      <TextAreaField
        label="Description"
        value={form.description}
        rows={3}
        onChange={(v) => set('description', v)}
      />
      <TextField
        label="Sort order"
        type="number"
        value={form.sortOrder}
        error={errors.sortOrder}
        hint="Controls the order systems appear in. Defaults to 0."
        onChange={(v) => set('sortOrder', v)}
      />
    </FormDialog>
  );
}

// ─── Add test dialog ───────────────────────────────────────────────────────

interface TestForm {
  testNumber: string;
  title: string;
  description: string;
  procedure: string;
  acceptanceCriteria: string;
}

const EMPTY_TEST: TestForm = {
  testNumber: '',
  title: '',
  description: '',
  procedure: '',
  acceptanceCriteria: '',
};

function AddTestDialog({
  system,
  onOpenChange,
  orgId,
}: {
  system: CommissioningSystem | null;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}) {
  const [form, setForm] = useState<TestForm>(EMPTY_TEST);
  const [errors, setErrors] = useState<Partial<Record<keyof TestForm, string>>>(
    {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const addTest = useAddTestToSystem(orgId);

  const set = <K extends keyof TestForm>(key: K, value: TestForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setForm(EMPTY_TEST);
      setErrors({});
      setSubmitError(null);
    }
  };

  const handleSubmit = () => {
    if (!system) return;
    // Mirrors CreateCommissioningTestDto's @IsNotEmpty fields.
    const found: Partial<Record<keyof TestForm, string>> = {};
    if (!form.testNumber.trim())
      found.testNumber = 'Test number is required.';
    if (!form.title.trim()) found.title = 'Title is required.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitError(null);

    addTest.mutate(
      {
        systemId: system.id,
        data: buildPayload({
          testNumber: form.testNumber,
          title: form.title,
          description: form.description,
          procedure: form.procedure,
          acceptanceCriteria: form.acceptanceCriteria,
        }),
      },
      {
        onSuccess: () => {
          toast.success('Test added');
          close(false);
        },
        onError: (err) => setSubmitError(apiErrorMessage(err)),
      },
    );
  };

  return (
    <FormDialog
      open={system !== null}
      onOpenChange={close}
      title="Add a commissioning test"
      description={system ? `Added to the ${system.name} system.` : undefined}
      submitLabel="Add test"
      onSubmit={handleSubmit}
      pending={addTest.isPending}
      error={submitError}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Test number"
          required
          value={form.testNumber}
          error={errors.testNumber}
          placeholder="CIP-TEST-001"
          onChange={(v) => set('testNumber', v)}
        />
        <TextField
          label="Title"
          required
          value={form.title}
          error={errors.title}
          placeholder="Agitator no-load run"
          onChange={(v) => set('title', v)}
        />
      </div>
      <TextAreaField
        label="Description"
        value={form.description}
        rows={2}
        onChange={(v) => set('description', v)}
      />
      <TextAreaField
        label="Procedure"
        value={form.procedure}
        rows={3}
        onChange={(v) => set('procedure', v)}
      />
      <TextAreaField
        label="Acceptance criteria"
        value={form.acceptanceCriteria}
        rows={2}
        placeholder="Vibration < 4.5 mm/s RMS; bearing temp < 70°C after 4h"
        onChange={(v) => set('acceptanceCriteria', v)}
      />
    </FormDialog>
  );
}

function buildColumns(
  onAddTest: (system: CommissioningSystem) => void,
): ColumnDef<CommissioningSystem>[] {
  return [
  {
    accessorKey: 'sortOrder',
    header: '#',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.sortOrder}
      </span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'System',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        {row.original.description && (
          <span className="text-xs text-muted-foreground">
            {row.original.description}
          </span>
        )}
      </div>
    ),
  },
  {
    id: 'tests',
    header: 'Tests',
    cell: ({ row }) => row.original._count?.tests ?? row.original.tests.length,
  },
  {
    id: 'passed',
    header: 'Passed',
    cell: ({ row }) =>
      row.original.tests.filter((t) => t.result === 'PASSED').length,
  },
  {
    id: 'approved',
    header: 'Approved',
    cell: ({ row }) =>
      row.original.tests.filter((t) => t.status === 'APPROVED').length,
  },
  {
    id: 'failed',
    header: 'Failed',
    cell: ({ row }) => {
      const failed = row.original.tests.filter(
        (t) => t.result === 'FAILED',
      ).length;
      return failed > 0 ? (
        <Badge variant="destructive">{failed}</Badge>
      ) : (
        <span className="text-muted-foreground">0</span>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
            aria-label={`Actions for ${row.original.name}`}
          >
            <MoreHorizontal className="h-4 w-4" />
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
              onSelect={() => onAddTest(row.original)}
            >
              <FlaskConical className="h-3.5 w-3.5" /> Add test
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    ),
  },
  ];
}

export function AdminCommissioningList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const {
    data: projectsData,
    isLoading: projectsLoading,
    isError: projectsError,
    refetch: refetchProjects,
  } = useProjects<ProjectSummary>(orgId);
  const projects = projectsData?.data ?? [];

  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  const {
    data: systems,
    isLoading: systemsLoading,
    isError: systemsError,
    refetch: refetchSystems,
  } = useCommissioningSystems<CommissioningSystem>(orgId, projectId);
  const { data: progress } = useCommissioningProgress(orgId, projectId);

  const [createSystemOpen, setCreateSystemOpen] = useState(false);
  const [addTestFor, setAddTestFor] = useState<CommissioningSystem | null>(
    null,
  );

  const selectedProject = projects.find((p) => p.id === projectId);
  const projectLabel = selectedProject
    ? `${selectedProject.projectNumber} — ${selectedProject.name}`
    : 'this project';
  const columns = buildColumns(setAddTestFor);

  if (projectsLoading) return <PageSkeleton />;
  if (projectsError) return <ErrorState retry={() => void refetchProjects()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Commissioning"
        description="System-based test plans, results, evidence, qualified approvals and handover readiness."
        actions={
          projects.length > 0 ? (
            <>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.projectNumber} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="brand"
                disabled={!projectId}
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setCreateSystemOpen(true)}
              >
                Add System
              </Button>
            </>
          ) : undefined
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-6 w-6" />}
          title="No projects to commission"
          description="Commissioning systems are tracked per project — create a project first."
        />
      ) : !projectId ? (
        <EmptyState
          icon={<ClipboardCheck className="h-6 w-6" />}
          title="Select a project"
          description="Choose a project above to view its commissioning systems."
        />
      ) : systemsLoading ? (
        <PageSkeleton />
      ) : systemsError ? (
        <ErrorState retry={() => void refetchSystems()} />
      ) : (
        <>
          {progress && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="tech-label mb-1">Systems</p>
                <p className="text-xl font-bold font-display">
                  {progress.systems}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="tech-label mb-1">Tests Passed</p>
                <p className="text-xl font-bold font-display text-success">
                  {progress.passed} / {progress.total}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="tech-label mb-1">Approved</p>
                <p className="text-xl font-bold font-display text-brand-600 dark:text-brand-400">
                  {progress.completionPct}%
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="tech-label mb-1">Handover Ready</p>
                <p className="text-xl font-bold font-display">
                  {progress.canHandover ? (
                    <Badge variant="success">Ready</Badge>
                  ) : (
                    <Badge variant="warning">Not ready</Badge>
                  )}
                </p>
              </div>
            </div>
          )}

          {!systems || systems.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="h-6 w-6" />}
              title="No commissioning systems yet"
              description="Systems appear here once created for this project."
              action={
                <Button
                  variant="brand"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setCreateSystemOpen(true)}
                >
                  Add System
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={columns}
              data={systems}
              searchColumn="name"
              searchPlaceholder="Search systems…"
            />
          )}
        </>
      )}

      <CreateSystemDialog
        open={createSystemOpen}
        onOpenChange={setCreateSystemOpen}
        orgId={orgId}
        projectId={projectId}
        projectLabel={projectLabel}
      />
      <AddTestDialog
        system={addTestFor}
        onOpenChange={(open) => {
          if (!open) setAddTestFor(null);
        }}
        orgId={orgId}
      />
    </div>
  );
}
