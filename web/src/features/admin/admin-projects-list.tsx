'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  FolderKanban,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
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
  useProjects,
  useCreateProject,
  useUpdateProject,
  useTransitionProject,
} from '@/lib/api/hooks/use-projects';
import { useClients } from '@/lib/api/hooks/use-clients';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { compact, toIsoDate, toDateInput } from '@/lib/api/payload';
import { formatRelativeDate, formatCurrency } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  projectNumber: string;
  name: string;
  description?: string | null;
  clientId?: string | null;
  /** Nested from findAll include */
  client?: { id: string; companyName: string } | null;
  location: string | null;
  country?: string | null;
  status: string;
  type?: string | null;
  budget: number | null;
  budgetAmount?: number | null;
  contractValue?: number | null;
  currency: string;
  startDate: string | null;
  targetEndDate?: string | null;
  mineralType?: string | null;
  /** Nested from findAll include */
  manager?: { id: string; firstName: string; lastName: string } | null;
  notes?: string | null;
  createdAt: string;
  _count?: { milestones: number; tasks: number };
}

interface ClientOption {
  id: string;
  companyName: string;
}

const LIFECYCLE_STAGES = [
  'AWARDED',
  'PLANNING',
  'ENGINEERING',
  'PROCUREMENT',
  'CONSTRUCTION',
  'INSTALLATION',
  'COMMISSIONING',
  'HANDOVER',
  'SUPPORT',
  'COMPLETED',
];

/** Mirror of the server-side STATUS_TRANSITIONS map — drives the stage select. */
const PROJECT_TRANSITIONS: Record<string, string[]> = {
  AWARDED:       ['PLANNING', 'ON_HOLD', 'CANCELLED'],
  PLANNING:      ['ENGINEERING', 'ON_HOLD', 'CANCELLED'],
  ENGINEERING:   ['PROCUREMENT', 'PLANNING', 'ON_HOLD'],
  PROCUREMENT:   ['CONSTRUCTION', 'ENGINEERING', 'ON_HOLD'],
  CONSTRUCTION:  ['INSTALLATION', 'PROCUREMENT', 'ON_HOLD'],
  INSTALLATION:  ['COMMISSIONING', 'CONSTRUCTION', 'ON_HOLD'],
  COMMISSIONING: ['HANDOVER', 'INSTALLATION', 'ON_HOLD'],
  HANDOVER:      ['SUPPORT', 'COMMISSIONING'],
  SUPPORT:       ['COMPLETED', 'ON_HOLD'],
  COMPLETED:     [],
  ON_HOLD:       ['PLANNING', 'ENGINEERING', 'PROCUREMENT', 'CONSTRUCTION', 'CANCELLED'],
  CANCELLED:     [],
};

/** Matches `ProjectType` in prisma/schema.prisma. */
const PROJECT_TYPES = [
  'CIP_PLANT',
  'CIL_PLANT',
  'HEAP_LEACH',
  'GRAVITY_PLANT',
  'FLOTATION_PLANT',
  'CRUSHING_PLANT',
  'MINERAL_PROCESSING',
  'MINE_INFRASTRUCTURE',
  'CIVIL_WORKS',
  'ELECTRICAL_WORKS',
  'MECHANICAL_WORKS',
  'MIXED',
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

const selectClass =
  'h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/**
 * Mirrors `CreateProjectDto` — only `name` is `@IsNotEmpty()`; everything else
 * is `@IsOptional()` and must be omitted rather than sent blank.
 */
const projectSchema = z.object({
  name: z.string().trim().min(2, 'Project name is required'),
  clientId: z.string().optional(),
  type: z.string().optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  mineralType: z.string().optional(),
  contractValue: z.string().optional(),
  budgetAmount: z.string().optional(),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
  description: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const EMPTY_PROJECT: ProjectFormValues = {
  name: '',
  clientId: '',
  type: 'MINERAL_PROCESSING',
  location: '',
  country: 'Kenya',
  currency: 'USD',
  mineralType: '',
  contractValue: '',
  budgetAmount: '',
  startDate: '',
  targetEndDate: '',
  description: '',
};

function toPayload(values: ProjectFormValues) {
  const contractValue = Number(values.contractValue);
  const budgetAmount = Number(values.budgetAmount);
  return compact({
    name: values.name.trim(),
    clientId: values.clientId,
    type: values.type,
    location: values.location,
    country: values.country,
    currency: values.currency,
    mineralType: values.mineralType,
    contractValue: values.contractValue ? contractValue : undefined,
    budgetAmount: values.budgetAmount ? budgetAmount : undefined,
    startDate: toIsoDate(values.startDate),
    targetEndDate: toIsoDate(values.targetEndDate),
    description: values.description,
  });
}

function LifecycleBar({ status }: { status: string }) {
  const currentIdx = LIFECYCLE_STAGES.indexOf(status);
  return (
    <div className="flex items-center gap-0.5 mt-1.5">
      {LIFECYCLE_STAGES.map((stage, i) => (
        <div
          key={stage}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors',
            i <= currentIdx ? 'bg-teal-500' : 'bg-muted',
            i === currentIdx && 'ring-1 ring-teal-500/50',
          )}
          title={stage}
        />
      ))}
    </div>
  );
}

interface RowHandlers {
  onEdit: (project: Project) => void;
  onAdvance: (project: Project) => void;
  onCancel: (project: Project) => void;
}

function RowActions({
  project,
  handlers,
}: {
  project: Project;
  handlers: RowHandlers;
}) {
  const isTerminal =
    project.status === 'COMPLETED' || project.status === 'CANCELLED';
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
          className="z-50 min-w-[160px] rounded-xl border border-border bg-card p-1 shadow-xl"
        >
          <DropdownMenu.Item asChild>
            <Link
              href={`/admin/projects/${project.id}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            >
              <Eye className="h-3.5 w-3.5" /> View project
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onEdit(project)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit details
          </DropdownMenu.Item>
          {!isTerminal && (
            <DropdownMenu.Item
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
              onSelect={() => handlers.onAdvance(project)}
            >
              <ArrowRight className="h-3.5 w-3.5" /> Advance stage
            </DropdownMenu.Item>
          )}
          {!isTerminal && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive outline-none cursor-pointer hover:bg-destructive/10"
                onSelect={() => handlers.onCancel(project)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Cancel project
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function buildColumns(handlers: RowHandlers): ColumnDef<Project>[] {
  return [
    {
      accessorKey: 'projectNumber',
      header: 'Project #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.projectNumber}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Project Name',
      cell: ({ row }) => (
        <Link
          href={`/admin/projects/${row.original.id}`}
          className="font-medium hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'client',
      header: 'Client',
      cell: ({ row }) => row.original.client?.companyName ?? '—',
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) =>
        row.original.location ? (
          <span className="flex items-center gap-1.5 text-xs">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            {row.original.location}
          </span>
        ) : (
          '—'
        ),
    },
    {
      accessorKey: 'status',
      header: 'Lifecycle',
      cell: ({ row }) => (
        <div className="min-w-[140px]">
          <StatusBadge status={row.original.status} />
          <LifecycleBar status={row.original.status} />
        </div>
      ),
    },
    {
      accessorKey: 'budget',
      header: 'Budget',
      cell: ({ row }) => {
        const value = row.original.budget ?? row.original.budgetAmount;
        return value ? (
          <span className="font-semibold text-teal-600 dark:text-teal-400 tabular-nums">
            {formatCurrency(Number(value), row.original.currency || 'USD', true)}
          </span>
        ) : (
          '—'
        );
      },
    },
    {
      accessorKey: 'manager',
      header: 'Manager',
      cell: ({ row }) => {
        const m = row.original.manager;
        return m ? `${m.firstName} ${m.lastName}` : '—';
      },
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
        <RowActions project={row.original} handlers={handlers} />
      ),
    },
  ];
}

export function AdminProjectsList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';
  const { data, isLoading, isError, refetch } = useProjects(orgId);
  const projects = (data?.data ?? []) as unknown as Project[];

  const { data: clientsResponse } = useClients<ClientOption>(orgId, {
    limit: 200,
  });
  const clientOptions = clientsResponse?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [cancelling, setCancelling] = useState<Project | null>(null);
  const [advancing, setAdvancing] = useState<Project | null>(null);
  const [nextStage, setNextStage] = useState('');

  const createProject = useCreateProject(orgId);
  const updateProject = useUpdateProject(orgId, editing?.id ?? '');
  const cancelProject = useTransitionProject(orgId, cancelling?.id ?? '');
  const advanceProject = useTransitionProject(orgId, advancing?.id ?? '');

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: EMPTY_PROJECT,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_PROJECT);
    setDialogOpen(true);
  };

  const handleExport = () => {
    if (!projects.length) { toast.error('No data to export'); return; }
    const headers = ['Project #', 'Name', 'Client', 'Type', 'Status', 'Location', 'Country', 'Mineral', 'Contract Value', 'Budget', 'Currency', 'Start Date', 'Target End', 'Manager', 'Created'];
    const csv = [
      headers.join(','),
      ...projects.map((p) => [
        p.projectNumber,
        p.name,
        p.client?.companyName ?? '',
        p.type ?? '',
        p.status,
        p.location ?? '',
        p.country ?? '',
        p.mineralType ?? '',
        p.contractValue != null ? Number(p.contractValue).toFixed(2) : '',
        (p.budgetAmount ?? p.budget) != null ? Number(p.budgetAmount ?? p.budget).toFixed(2) : '',
        p.currency,
        p.startDate ? new Date(p.startDate).toLocaleDateString('en-KE') : '',
        p.targetEndDate ? new Date(p.targetEndDate).toLocaleDateString('en-KE') : '',
        p.manager ? `${p.manager.firstName} ${p.manager.lastName}` : '',
        new Date(p.createdAt).toLocaleDateString('en-KE'),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `projects-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Export ready');
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    reset({
      name: project.name ?? '',
      clientId: project.clientId ?? '',
      type: project.type ?? 'MINERAL_PROCESSING',
      location: project.location ?? '',
      country: project.country ?? 'Kenya',
      currency: project.currency ?? 'USD',
      mineralType: project.mineralType ?? '',
      contractValue:
        project.contractValue != null ? String(project.contractValue) : '',
      budgetAmount:
        project.budgetAmount != null
          ? String(project.budgetAmount)
          : project.budget != null
            ? String(project.budget)
            : '',
      startDate: toDateInput(project.startDate),
      targetEndDate: toDateInput(project.targetEndDate),
      description: project.description ?? '',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: ProjectFormValues) => {
    const payload = toPayload(values);
    try {
      if (editing) {
        await updateProject.mutateAsync(payload);
        toast.success('Project updated', { description: values.name });
      } else {
        await createProject.mutateAsync(payload);
        toast.success('Project created', { description: values.name });
      }
      setDialogOpen(false);
      setEditing(null);
      reset(EMPTY_PROJECT);
    } catch (error) {
      toast.error(editing ? 'Could not update project' : 'Could not create project', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmCancel = async () => {
    if (!cancelling) return;
    try {
      await cancelProject.mutateAsync('CANCELLED');
      toast.success('Project cancelled', { description: cancelling.name });
      setCancelling(null);
    } catch (error) {
      toast.error('Could not cancel project', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const confirmAdvance = async () => {
    if (!advancing || !nextStage) return;
    try {
      await advanceProject.mutateAsync(nextStage);
      toast.success(`Project moved to ${nextStage.replace(/_/g, ' ')}`, {
        description: advancing.name,
      });
      setAdvancing(null);
      setNextStage('');
    } catch (error) {
      toast.error('Could not advance project', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const columns = useMemo(
    () =>
      buildColumns({
        onEdit: openEdit,
        onAdvance: (project) => {
          setAdvancing(project);
          // Pre-select the first valid transition from the current status
          const validNext = PROJECT_TRANSITIONS[project.status] ?? [];
          setNextStage(validNext[0] ?? '');
        },
        onCancel: setCancelling,
      }),
    // openEdit only closes over stable setters and `reset`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  const active = projects.filter(
    (p) => !['COMPLETED', 'CANCELLED', 'ON_HOLD'].includes(p.status),
  ).length;

  const saving = createProject.isPending || updateProject.isPending;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Projects"
        description="Controlled mining-plant delivery records from award through handover and operational support."
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
              Create Project
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
            label: 'Total Projects',
            value: projects.length,
            icon: <FolderKanban className="h-4 w-4" />,
            accent: 'brand' as const,
          },
          {
            label: 'Active',
            value: active,
            icon: <Calendar className="h-4 w-4" />,
            accent: 'success' as const,
          },
          {
            label: 'In Construction',
            value: projects.filter((p) => p.status === 'CONSTRUCTION').length,
            icon: <Users className="h-4 w-4" />,
            accent: 'warning' as const,
          },
          {
            label: 'Completed',
            value: projects.filter((p) => p.status === 'COMPLETED').length,
            icon: <FolderKanban className="h-4 w-4" />,
            accent: 'default' as const,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="glass-card rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {kpi.label}
              </p>
              <p className="text-2xl font-bold mt-1">{kpi.value}</p>
            </div>
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                kpi.accent === 'brand' &&
                  'bg-teal-500/10 text-teal-600 dark:text-teal-400',
                kpi.accent === 'success' &&
                  'bg-emerald-500/10 text-emerald-600',
                kpi.accent === 'warning' && 'bg-amber-500/10 text-amber-600',
                kpi.accent === 'default' && 'bg-muted text-muted-foreground',
              )}
            >
              {kpi.icon}
            </div>
          </div>
        ))}
      </motion.div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="No projects yet"
          description="Projects appear here once awarded and created through the delivery workflow."
          action={
            <Button
              variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Create Project
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={projects}
          searchColumn="name"
          searchPlaceholder="Search projects…"
        />
      )}

      {/* Create / Edit Project Dialog */}
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
              {editing ? 'Edit Project' : 'Create New Project'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the delivery record for this awarded project.'
                : 'Start a new mining plant delivery project from an awarded contract.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
            <div className="grid gap-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="project-name">Project name *</Label>
                <Input
                  id="project-name"
                  placeholder="Bondo CIP Gold Plant — Phase 1"
                  {...register('name')}
                  error={errors.name?.message}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="project-client">Client</Label>
                <select
                  id="project-client"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="project-type">Project type</Label>
                  <select
                    id="project-type"
                    className={selectClass}
                    {...register('type')}
                  >
                    {PROJECT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="project-mineral">Mineral</Label>
                  <select
                    id="project-mineral"
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="project-location">Location</Label>
                  <Input
                    id="project-location"
                    placeholder="Siaya County"
                    leftIcon={<MapPin className="h-4 w-4" />}
                    {...register('location')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="project-country">Country</Label>
                  <Input
                    id="project-country"
                    placeholder="Kenya"
                    {...register('country')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="project-contract">Contract value</Label>
                  <Input
                    id="project-contract"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    {...register('contractValue')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="project-budget">Budget</Label>
                  <Input
                    id="project-budget"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    {...register('budgetAmount')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="project-currency">Currency</Label>
                  <select
                    id="project-currency"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="project-start">Start date</Label>
                  <Input
                    id="project-start"
                    type="date"
                    {...register('startDate')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="project-end">Target completion</Label>
                  <Input
                    id="project-end"
                    type="date"
                    {...register('targetEndDate')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="project-description">Scope / description</Label>
                <Textarea
                  id="project-description"
                  rows={3}
                  className="min-h-[80px]"
                  placeholder="Plant scope, capacity, delivery model…"
                  {...register('description')}
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
                {editing ? 'Save Changes' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Advance lifecycle stage */}
      <Dialog
        open={!!advancing}
        onOpenChange={(open) => {
          if (advanceProject.isPending) return;
          if (!open) {
            setAdvancing(null);
            setNextStage('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Advance project stage</DialogTitle>
            <DialogDescription>
              {advancing?.name} is currently at{' '}
              {advancing?.status.replace(/_/g, ' ')}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="project-next-stage">Move to</Label>
              <select
                id="project-next-stage"
                className={selectClass}
                value={nextStage}
                onChange={(event) => setNextStage(event.target.value)}
              >
                <option value="">Select stage…</option>
                {(PROJECT_TRANSITIONS[advancing?.status ?? ''] ?? [...LIFECYCLE_STAGES, 'ON_HOLD', 'CANCELLED']).map((stage) => (
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
              disabled={advanceProject.isPending}
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
              loading={advanceProject.isPending}
              onClick={() => void confirmAdvance()}
            >
              Advance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(open) => {
          if (!open) setCancelling(null);
        }}
        title="Cancel this project?"
        description={
          <>
            {cancelling?.name} will be moved to CANCELLED. Its milestones, tasks
            and financial records are kept for audit.
          </>
        }
        confirmLabel="Cancel project"
        cancelLabel="Keep project"
        loading={cancelProject.isPending}
        onConfirm={() => void confirmCancel()}
      />
    </div>
  );
}
