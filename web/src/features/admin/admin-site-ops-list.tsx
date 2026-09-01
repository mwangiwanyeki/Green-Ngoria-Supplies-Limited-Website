'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import { HardHat, Plus, Download, Users } from 'lucide-react';
import { motion } from 'motion/react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
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
import { useProjects } from '@/lib/api/hooks/use-projects';
import {
  useSiteReports,
  useCreateSiteReport,
} from '@/lib/api/hooks/use-site-operations';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { compact, toIsoDate } from '@/lib/api/payload';
import { formatDate } from '@/lib/utils';

interface DailyReport {
  id: string;
  projectId: string;
  reportDate: string;
  weather: string | null;
  workAreas: string | null;
  laborCount: number | null;
  activities: string;
  progress: string | null;
  materials: string | null;
  equipment: string | null;
  issues: string | null;
  nextDayPlan: string | null;
  createdAt: string;
}

interface ProjectOption {
  id: string;
  projectNumber: string;
  name: string;
}

const selectClass =
  'h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/**
 * Mirrors `CreateSiteReportDto` — `projectId` (`@IsUUID()`), `reportDate`
 * (`@IsDate()`) and `activities` (`@IsNotEmpty()`) are required.
 */
const reportSchema = z.object({
  projectId: z.string().uuid('Select the project this shift belongs to'),
  reportDate: z.string().min(1, 'Pick the shift date'),
  activities: z
    .string()
    .trim()
    .min(5, 'Describe the activities performed this shift'),
  weather: z.string().optional(),
  workAreas: z.string().optional(),
  laborCount: z.string().optional(),
  progress: z.string().optional(),
  materials: z.string().optional(),
  equipment: z.string().optional(),
  issues: z.string().optional(),
  nextDayPlan: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

const EMPTY_REPORT: ReportFormValues = {
  projectId: '',
  reportDate: '',
  activities: '',
  weather: '',
  workAreas: '',
  laborCount: '',
  progress: '',
  materials: '',
  equipment: '',
  issues: '',
  nextDayPlan: '',
};

/**
 * The backend exposes no PATCH or DELETE for site reports — a daily log is an
 * append-only record — so rows carry no edit or delete action.
 */
const columns: ColumnDef<DailyReport>[] = [
  {
    accessorKey: 'reportDate',
    header: 'Shift Date',
    cell: ({ row }) => (
      <span className="font-medium text-xs">
        {formatDate(row.original.reportDate)}
      </span>
    ),
  },
  {
    accessorKey: 'workAreas',
    header: 'Work Areas',
    cell: ({ row }) => row.original.workAreas ?? '—',
  },
  {
    accessorKey: 'laborCount',
    header: 'Headcount',
    cell: ({ row }) => (
      <span className="flex items-center gap-1.5 text-xs font-semibold tabular-nums">
        <Users className="h-3 w-3 text-muted-foreground" />
        {row.original.laborCount ?? 0}
      </span>
    ),
  },
  {
    accessorKey: 'activities',
    header: 'Activity Summary',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground truncate max-w-[240px] block">
        {row.original.activities}
      </span>
    ),
  },
  {
    accessorKey: 'weather',
    header: 'Weather',
    cell: ({ row }) => (
      <span className="text-xs">{row.original.weather ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'issues',
    header: 'Issues Raised',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground truncate max-w-[180px] block">
        {row.original.issues ?? 'None'}
      </span>
    ),
  },
];

export function AdminSiteOpsList() {
  const { data: me } = useMe();
  const orgId = me?.organizationId ?? '';

  const { data: projectsResponse } = useProjects<ProjectOption>(orgId, {
    limit: 200,
  });
  const projects = projectsResponse?.data ?? [];

  // `GET .../site-operations/reports` binds `projectId` with a ParseUUIDPipe,
  // so the list is always scoped to a single project.
  const [selectedProjectId, setSelectedProjectId] = useState('');
  useEffect(() => {
    if (!selectedProjectId && projects.length) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const { data, isLoading, isError, refetch } = useSiteReports<DailyReport>(
    orgId,
    selectedProjectId,
  );
  const items = data?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const createReport = useCreateSiteReport(orgId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: EMPTY_REPORT,
  });

  const openCreate = () => {
    reset({ ...EMPTY_REPORT, projectId: selectedProjectId });
    setDialogOpen(true);
  };

  const onSubmit = async (values: ReportFormValues) => {
    const laborCount = Number(values.laborCount);
    try {
      await createReport.mutateAsync(
        compact({
          projectId: values.projectId,
          reportDate: toIsoDate(values.reportDate),
          activities: values.activities.trim(),
          weather: values.weather,
          workAreas: values.workAreas,
          laborCount: values.laborCount ? laborCount : undefined,
          progress: values.progress,
          materials: values.materials,
          equipment: values.equipment,
          issues: values.issues,
          nextDayPlan: values.nextDayPlan,
        }),
      );
      toast.success('Daily report submitted', {
        description: formatDate(values.reportDate),
      });
      setSelectedProjectId(values.projectId);
      setDialogOpen(false);
      reset(EMPTY_REPORT);
    } catch (error) {
      toast.error('Could not submit daily report', {
        description: getApiErrorMessage(error),
      });
    }
  };

  const saving = createReport.isPending;

  if (projects.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <PageHeader
          title="Site Operations & Daily Logs"
          description="Daily construction progress, workforce, equipment, issues and next-day plans."
        />
        <EmptyState
          icon={<HardHat className="h-6 w-6" />}
          title="No projects to report against"
          description="Daily site logs belong to a project. Create a project first, then submit shift reports here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Site Operations & Daily Logs"
        description="Daily construction progress, workforce, equipment, issues, photographs and next-day plans."
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
              Submit Daily Report
            </Button>
          </div>
        }
      />

      <div className="glass-card rounded-xl p-4 flex flex-col gap-1.5 sm:max-w-md">
        <Label htmlFor="site-ops-project">Project</Label>
        <select
          id="site-ops-project"
          className={selectClass}
          value={selectedProjectId}
          onChange={(event) => setSelectedProjectId(event.target.value)}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.projectNumber} — {project.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : isError ? (
        <ErrorState retry={() => void refetch()} />
      ) : (
        <>
          {/* KPI stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {[
              { label: 'Logged Reports', value: items.length },
              {
                label: 'Peak Headcount',
                value: items.reduce(
                  (max, r) => Math.max(max, r.laborCount ?? 0),
                  0,
                ),
              },
              {
                label: 'Shifts With Issues',
                value: items.filter((r) => !!r.issues).length,
              },
              {
                label: 'Latest Report',
                value: items.length ? formatDate(items[0].reportDate) : '—',
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
              icon={<HardHat className="h-6 w-6" />}
              title="No daily site logs recorded"
              description="Site supervisors submit shift progress, fabrication milestones, and concrete pours here."
              action={
                <Button
                  variant="brand"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={openCreate}
                >
                  Submit Daily Report
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={columns}
              data={items}
              searchColumn="activities"
              searchPlaceholder="Search daily logs by activity…"
            />
          )}
        </>
      )}

      {/* Submit Report Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (saving) return;
          setDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Daily Site Shift Report</DialogTitle>
            <DialogDescription>
              Record workforce headcount, progress notes, weather and issues for
              one shift.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
          >
            <div className="grid gap-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="report-project">Project *</Label>
                <select
                  id="report-project"
                  className={selectClass}
                  {...register('projectId')}
                >
                  <option value="">Select a project…</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.projectNumber} — {project.name}
                    </option>
                  ))}
                </select>
                {errors.projectId && (
                  <p
                    className="text-xs font-medium text-destructive"
                    role="alert"
                  >
                    {errors.projectId.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="report-date">Shift date *</Label>
                  <Input
                    id="report-date"
                    type="date"
                    {...register('reportDate')}
                    error={errors.reportDate?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="report-labor">Workforce headcount</Label>
                  <Input
                    id="report-labor"
                    type="number"
                    min={0}
                    step="1"
                    placeholder="0"
                    {...register('laborCount')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="report-weather">Weather</Label>
                  <Input
                    id="report-weather"
                    placeholder="Dry, 27°C"
                    {...register('weather')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="report-areas">Work areas</Label>
                  <Input
                    id="report-areas"
                    placeholder="Mill foundation, CIP tank farm"
                    {...register('workAreas')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="report-activities">Activities *</Label>
                <Textarea
                  id="report-activities"
                  rows={3}
                  className="min-h-[90px]"
                  placeholder="Summary of civil works / installation completed during the shift…"
                  {...register('activities')}
                  error={errors.activities?.message}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="report-progress">Progress</Label>
                <Input
                  id="report-progress"
                  placeholder="Foundation 60% complete"
                  {...register('progress')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="report-materials">Materials used</Label>
                  <Input
                    id="report-materials"
                    placeholder="12 m³ concrete, 800 kg rebar"
                    {...register('materials')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="report-equipment">Equipment on site</Label>
                  <Input
                    id="report-equipment"
                    placeholder="25t crane, 2 concrete mixers"
                    {...register('equipment')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="report-issues">Issues raised</Label>
                <Textarea
                  id="report-issues"
                  rows={2}
                  className="min-h-[60px]"
                  placeholder="Delays, safety observations, material shortages…"
                  {...register('issues')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="report-next">Next day plan</Label>
                <Input
                  id="report-next"
                  placeholder="Strip formwork, begin tank plinth"
                  {...register('nextDayPlan')}
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
                Submit Daily Log
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
