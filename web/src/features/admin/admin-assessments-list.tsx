'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import {
  ClipboardCheck,
  Eye,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Activity,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  Flame,
  FileText,
  User,
  Filter,
  RefreshCw,
} from 'lucide-react';
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
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useAssessments,
  useTransitionAssessment,
} from '@/lib/api/hooks/use-assessments';
import { formatRelativeDate, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export interface AssessmentRecord {
  id: string;
  reference: string;
  clientName: string;
  projectName: string | null;
  miningLocation: string | null;
  mineralType: string | null;
  estimatedTph: string | number | null;
  oreGrade: string | number | null;
  oreMineralogy: string | null;
  oreHardness: string | null;
  oreDescription: string | null;
  hasExistingPlant: boolean;
  existingPlantDesc: string | null;
  existingCapacity: string | number | null;
  currentRecovery: string | number | null;
  targetRecovery: string | number | null;
  operationalProblems: string | null;
  clientObjectives: string | null;
  environmentalConstraints: string | null;
  hseConstraints: string | null;
  status: string;
  submittedAt: string | null;
  createdAt: string;
  lead?: { reference: string; contactEmail: string; contactPhone: string } | null;
  assignedEngineer?: { firstName: string; lastName: string } | null;
}

export function AdminAssessmentsList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null);

  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';

  const { data, isLoading, isError, refetch } = useAssessments(orgId, {
    page,
    limit: 50,
  });

  const transitionMutation = useTransitionAssessment(orgId);

  const assessments = (data?.data as AssessmentRecord[] | undefined) ?? [];

  const filteredAssessments = assessments.filter((a) => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  const handleStatusTransition = async (id: string, newStatus: string) => {
    try {
      await transitionMutation.mutateAsync({
        id,
        targetStatus: newStatus,
      });
      toast.success(`Assessment transitioned to ${newStatus}`);
      void refetch();
      if (selectedAssessment && selectedAssessment.id === id) {
        setSelectedAssessment({ ...selectedAssessment, status: newStatus });
      }
    } catch (err: any) {
      toast.error('Transition failed', {
        description: err?.message || 'Could not change status',
      });
    }
  };

  const columns: ColumnDef<AssessmentRecord>[] = [
    {
      accessorKey: 'reference',
      header: 'Reference',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-400">
          {row.original.reference}
        </span>
      ),
    },
    {
      accessorKey: 'clientName',
      header: 'Client / Operator',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-foreground">
            {row.original.clientName}
          </span>
          {row.original.lead && (
            <span className="block text-[0.6875rem] text-muted-foreground font-mono">
              {row.original.lead.reference} · {row.original.lead.contactEmail}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'miningLocation',
      header: 'Mining Site',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.miningLocation ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'mineralType',
      header: 'Commodity / TPH',
      cell: ({ row }) => (
        <span className="rounded bg-brand-500/10 px-2 py-0.5 text-xs font-bold text-brand-700 dark:text-brand-400">
          {row.original.mineralType || 'GOLD'} · {row.original.estimatedTph ? `${row.original.estimatedTph} TPH` : 'TBD'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Workflow Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Received',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedAssessment(row.original)}
          leftIcon={<Eye className="h-3.5 w-3.5" />}
        >
          Inspect
        </Button>
      ),
    },
  ];

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  const totalCount = assessments.length;
  const submittedCount = assessments.filter((a) => a.status === 'SUBMITTED').length;
  const reviewCount = assessments.filter((a) => ['UNDER_REVIEW', 'ENGINEERING_REVIEW'].includes(a.status)).length;
  const completedCount = assessments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Technical Plant Assessments (System 4)"
        description="Structured metallurgical and mechanical engineering intake records from mining operators and investors."
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void refetch()}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            <Link href="/technical-assessment" target="_blank">
              <Button size="sm" variant="brand">
                Open Public Intake Form
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-hairline bg-card p-5 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium">Total Assessment Records</span>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-sm">
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Awaiting Desk Review</span>
          <p className="mt-1 font-display text-2xl font-bold text-amber-700 dark:text-amber-400">{submittedCount}</p>
        </div>
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 shadow-sm">
          <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">In Engineering Review</span>
          <p className="mt-1 font-display text-2xl font-bold text-blue-700 dark:text-blue-400">{reviewCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 shadow-sm">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Completed Feasibilities</span>
          <p className="mt-1 font-display text-2xl font-bold text-emerald-700 dark:text-emerald-400">{completedCount}</p>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline pb-4">
        <span className="text-xs font-semibold text-muted-foreground mr-2 flex items-center gap-1">
          <Filter className="h-3.5 w-3.5" /> Filter:
        </span>
        {[
          { key: 'all', label: `All (${totalCount})` },
          { key: 'SUBMITTED', label: `Submitted (${submittedCount})` },
          { key: 'UNDER_REVIEW', label: 'Under Review' },
          { key: 'ENGINEERING_REVIEW', label: 'Engineering Review' },
          { key: 'REPORT_PREPARATION', label: 'Report Preparation' },
          { key: 'COMPLETED', label: `Completed (${completedCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
              statusFilter === tab.key
                ? 'bg-brand-500 text-black font-extrabold shadow-sm'
                : 'bg-surface-sunken text-muted-foreground hover:bg-card hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredAssessments.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-6 w-6" />}
          title="No assessments in this status"
          description="Technical plant assessments will appear here as clients submit online intake requests."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredAssessments}
          searchColumn="clientName"
          searchPlaceholder="Search by client or reference…"
        />
      )}

      {/* Detailed Technical Inspection Modal */}
      {selectedAssessment && (
        <Dialog open={!!selectedAssessment} onOpenChange={(open) => !open && setSelectedAssessment(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <span className="rounded bg-brand-500/10 px-2.5 py-1 font-mono text-xs font-bold text-brand-700 dark:text-brand-400">
                  {selectedAssessment.reference}
                </span>
                <StatusBadge status={selectedAssessment.status} />
              </div>
              <DialogTitle className="mt-2 font-display text-xl font-bold">
                {selectedAssessment.clientName} — {selectedAssessment.projectName || 'Plant Assessment'}
              </DialogTitle>
              <DialogDescription>
                Submitted {formatDate(selectedAssessment.createdAt)} · Location: {selectedAssessment.miningLocation || 'East Africa'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Client & Lead Information */}
              <div className="rounded-xl border border-hairline bg-surface-sunken p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Contact &amp; Lead Association
                </h4>
                <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Company:</span>{' '}
                    <strong className="text-foreground">{selectedAssessment.clientName}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>{' '}
                    <strong className="text-foreground">{selectedAssessment.miningLocation || 'N/A'}</strong>
                  </div>
                  {selectedAssessment.lead && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Lead Email:</span>{' '}
                        <strong className="text-foreground">{selectedAssessment.lead.contactEmail}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lead Phone:</span>{' '}
                        <strong className="text-foreground">{selectedAssessment.lead.contactPhone}</strong>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Ore & Mineral Metallurgy */}
              <div className="rounded-xl border border-hairline bg-surface-sunken p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Ore &amp; Mineralogical Data
                </h4>
                <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Target Mineral:</span>{' '}
                    <span className="font-bold text-brand-700 dark:text-brand-400">{selectedAssessment.mineralType || 'GOLD'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target Throughput:</span>{' '}
                    <strong className="text-foreground">{selectedAssessment.estimatedTph ? `${selectedAssessment.estimatedTph} TPH` : 'TBD'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Head Grade:</span>{' '}
                    <strong className="text-foreground">{selectedAssessment.oreGrade ? `${selectedAssessment.oreGrade} g/t` : 'TBD'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ore Hardness / BWi:</span>{' '}
                    <strong className="text-foreground">{selectedAssessment.oreHardness || 'N/A'}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Mineralogy Notes:</span>{' '}
                    <p className="mt-1 text-foreground">{selectedAssessment.oreMineralogy || 'None provided'}</p>
                  </div>
                  {selectedAssessment.oreDescription && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Geological Description:</span>{' '}
                      <p className="mt-1 text-foreground">{selectedAssessment.oreDescription}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Plant Infrastructure & Circuit Data */}
              <div className="rounded-xl border border-hairline bg-surface-sunken p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Plant &amp; Process Circuit Scope
                </h4>
                <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Has Operating Plant:</span>{' '}
                    <strong className="text-foreground">{selectedAssessment.hasExistingPlant ? 'Yes' : 'No (Greenfields)'}</strong>
                  </div>
                  {selectedAssessment.hasExistingPlant && (
                    <div>
                      <span className="text-muted-foreground">Existing Capacity:</span>{' '}
                      <strong className="text-foreground">{selectedAssessment.existingCapacity ? `${selectedAssessment.existingCapacity} TPH` : 'N/A'}</strong>
                    </div>
                  )}
                  {selectedAssessment.existingPlantDesc && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Existing Equipment:</span>{' '}
                      <p className="mt-1 text-foreground">{selectedAssessment.existingPlantDesc}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Current Recovery:</span>{' '}
                    <strong className="text-foreground">{selectedAssessment.currentRecovery ? `${selectedAssessment.currentRecovery}%` : 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target Recovery:</span>{' '}
                    <strong className="text-brand-700 dark:text-brand-400">{selectedAssessment.targetRecovery ? `${selectedAssessment.targetRecovery}%` : '90%'}</strong>
                  </div>
                </div>
              </div>

              {/* Bottlenecks & Client Objectives */}
              <div className="rounded-xl border border-hairline bg-surface-sunken p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Operational Bottlenecks &amp; Objectives
                </h4>
                <div className="mt-2 space-y-3 text-xs">
                  {selectedAssessment.operationalProblems && (
                    <div>
                      <span className="text-muted-foreground">Reported Challenges:</span>
                      <p className="mt-0.5 text-foreground">{selectedAssessment.operationalProblems}</p>
                    </div>
                  )}
                  {selectedAssessment.clientObjectives && (
                    <div>
                      <span className="text-muted-foreground">Client Objectives:</span>
                      <p className="mt-0.5 text-foreground">{selectedAssessment.clientObjectives}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Workflow Actions */}
              <div className="rounded-xl border border-brand-500/30 bg-card p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Engineering Workflow State Machine
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Transition this assessment through professional engineering review gates:
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={selectedAssessment.status === 'UNDER_REVIEW' ? 'brand' : 'outline'}
                    onClick={() => handleStatusTransition(selectedAssessment.id, 'UNDER_REVIEW')}
                  >
                    Set Under Review
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedAssessment.status === 'ENGINEERING_REVIEW' ? 'brand' : 'outline'}
                    onClick={() => handleStatusTransition(selectedAssessment.id, 'ENGINEERING_REVIEW')}
                  >
                    Start Engineering Review
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedAssessment.status === 'REPORT_PREPARATION' ? 'brand' : 'outline'}
                    onClick={() => handleStatusTransition(selectedAssessment.id, 'REPORT_PREPARATION')}
                  >
                    Report Preparation
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedAssessment.status === 'COMPLETED' ? 'brand' : 'outline'}
                    onClick={() => handleStatusTransition(selectedAssessment.id, 'COMPLETED')}
                  >
                    Mark Completed
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedAssessment(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
