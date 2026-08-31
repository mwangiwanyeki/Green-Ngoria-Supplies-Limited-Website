'use client';

import { useEffect, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { ClipboardCheck, ListChecks } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
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
} from '@/lib/api/hooks/use-commissioning';
import type { ProjectSummary } from '@/lib/api/models';

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

const columns: ColumnDef<CommissioningSystem>[] = [
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
];

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

  if (projectsLoading) return <PageSkeleton />;
  if (projectsError) return <ErrorState retry={() => void refetchProjects()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Commissioning"
        description="System-based test plans, results, evidence, qualified approvals and handover readiness."
        actions={
          projects.length > 0 ? (
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
    </div>
  );
}
