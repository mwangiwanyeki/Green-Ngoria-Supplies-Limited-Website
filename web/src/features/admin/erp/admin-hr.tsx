'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  MoreHorizontal,
  Plus,
  ShieldAlert,
  Users,
  UserRound,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Textarea } from '@/components/ui/input';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
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
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { KpiRow, formatKsh } from '@/components/admin/erp-list-shell';
import {
  useHrStaff,
  useHrOverview,
  useHrPayroll,
  useHrLeave,
  useCreateStaff,
  useTerminateStaff,
  useCreatePayrollRun,
  useCreateLeaveRequest,
  useReviewLeaveRequest,
  LEAVE_TYPES,
  EMPLOYMENT_TYPES,
  PAYMENT_TERMS,
  type StaffMember,
  type PayrollRun,
  type LeaveRequest,
  type LeaveType,
  type EmploymentType,
  type StaffPaymentTerms,
} from '@/lib/api/hooks/use-hr';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { useBranchStore } from '@/stores/branch-store';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// ── Overview ────────────────────────────────────────────────────────────────

export function AdminHrOverview() {
  const { data, isLoading, isError, refetch } = useHrOverview();
  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  const active = data?.byStatus?.ACTIVE ?? 0;
  const onLeave = data?.onLeaveNow ?? 0;
  const total = data?.totalStaff ?? 0;
  const users = data?.linkedUsers ?? 0;
  const checkedIn = data?.checkedInToday ?? 0;
  const newHires = data?.newThisMonth ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="HR Overview"
        description="Aggregate headcount and HR KPIs for the active branch."
      />
      <KpiRow
        items={[
          {
            label: 'Total Staff',
            value: total,
            icon: <Users className="h-4 w-4" />,
            accent: 'brand',
          },
          {
            label: 'Active',
            value: active,
            icon: <CheckCircle2 className="h-4 w-4" />,
            accent: 'success',
          },
          {
            label: 'On Leave',
            value: onLeave,
            icon: <CalendarDays className="h-4 w-4" />,
            accent: 'warning',
          },
          {
            label: 'Users',
            value: users,
            icon: <UserRound className="h-4 w-4" />,
            accent: 'default',
          },
          {
            label: 'Checked-in today',
            value: checkedIn,
            icon: <CheckCircle2 className="h-4 w-4" />,
            accent: 'success',
          },
          {
            label: 'New this month',
            value: newHires,
            icon: <Plus className="h-4 w-4" />,
            accent: 'brand',
          },
        ]}
      />

      {total === 0 && (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No staff records yet"
          description="Add staff members from the Manage Staff tab; they'll show up here."
        />
      )}

      {data && Object.keys(data.byDepartment ?? {}).length > 0 && (
        <BreakdownCard
          title="Headcount by department"
          data={data.byDepartment}
        />
      )}
      {data && Object.keys(data.byEmploymentType ?? {}).length > 0 && (
        <BreakdownCard
          title="Headcount by employment type"
          data={data.byEmploymentType}
        />
      )}
    </div>
  );
}

function BreakdownCard({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-xl border border-hairline bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      <ul className="space-y-2">
        {rows.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono font-semibold tabular-nums">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Manage Staff ────────────────────────────────────────────────────────────

export function AdminHrStaff() {
  const branchId = useBranchStore((s) => s.activeBranchId) ?? '';
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const query = useHrStaff({ search: debouncedSearch, page, limit: perPage });

  const [showAdd, setShowAdd] = useState(false);
  const [terminateTarget, setTerminateTarget] = useState<StaffMember | null>(
    null,
  );

  const createStaff = useCreateStaff();
  const terminate = useTerminateStaff(terminateTarget?.id ?? '', branchId);

  const columns: ErpColumn<StaffMember>[] = [
    {
      key: 'name',
      header: 'Staff',
      cell: (r) => (
        <div>
          <div className="font-medium">
            {r.fullName ?? `${r.firstName} ${r.lastName}`}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {r.staffNumber}
          </div>
        </div>
      ),
    },
    { key: 'position', header: 'Position', cell: (r) => r.position ?? '—' },
    { key: 'dept', header: 'Department', cell: (r) => r.department ?? '—' },
    { key: 'phone', header: 'Phone', cell: (r) => r.phone ?? '—' },
    {
      key: 'salary',
      header: <span className="text-right block">Base salary</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums">
          {r.baseSalary ? formatKsh(r.baseSalary) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge
          variant={
            r.status === 'ACTIVE'
              ? 'success'
              : r.status === 'ON_LEAVE'
                ? 'warning'
                : r.status === 'TERMINATED'
                  ? 'destructive'
                  : 'mineral'
          }
        >
          {r.status ?? '—'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (r) => (
        <div className="flex justify-end">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="icon" aria-label="Row actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className="z-50 min-w-[180px] rounded-md border border-border bg-popover p-1 shadow-md"
              >
                {r.status !== 'TERMINATED' && (
                  <DropdownMenu.Item
                    onSelect={() => setTerminateTarget(r)}
                    className="cursor-pointer rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-muted"
                  >
                    Terminate…
                  </DropdownMenu.Item>
                )}
                {r.status === 'TERMINATED' && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No actions available
                  </div>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      ),
    },
  ];

  return (
    <>
      <ErpListPage
        title="Manage Staff"
        description="Employees and users at the active branch."
        actions={
          <Button
            size="sm"
            variant="brand"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAdd(true)}
            disabled={!branchId}
          >
            Add Staff
          </Button>
        }
        searchPlaceholder="Search name, position, department…"
        columns={columns}
        query={query}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
        emptyLabel="No staff records yet"
        rowKey={(r) => r.id}
      />

      {showAdd && (
        <AddStaffDialog
          branchId={branchId}
          onClose={() => setShowAdd(false)}
          submit={async (payload) => {
            await createStaff.mutateAsync({ ...payload, branchId });
            toast.success('Staff member added');
            setShowAdd(false);
          }}
          pending={createStaff.isPending}
        />
      )}

      <ConfirmDialog
        open={!!terminateTarget}
        onOpenChange={(o) => !o && setTerminateTarget(null)}
        title={`Terminate ${terminateTarget?.fullName ?? 'staff member'}?`}
        description="This removes them from the active roster. Their record and history are kept for reporting."
        confirmLabel="Terminate"
        destructive
        onConfirm={() => {
          if (!terminateTarget) return;
          terminate.mutate(undefined, {
            onSuccess: () => {
              toast.success('Staff terminated');
              setTerminateTarget(null);
            },
            onError: (err) =>
              toast.error(getApiErrorMessage(err, 'Termination failed')),
          });
        }}
      />
    </>
  );
}

function AddStaffDialog({
  branchId,
  onClose,
  submit,
  pending,
}: {
  branchId: string;
  onClose: () => void;
  submit: (
    payload: Omit<
      Parameters<ReturnType<typeof useCreateStaff>['mutateAsync']>[0],
      'branchId'
    >,
  ) => Promise<void>;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    idNumber: '',
    position: '',
    department: '',
    employmentType: 'FULL_TIME' as EmploymentType,
    paymentTerms: 'MONTHLY' as StaffPaymentTerms,
    baseSalary: '',
    hireDate: '',
    notes: '',
  });
  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (!form.firstName || !form.lastName) {
      toast.error('First and last name are required');
      return;
    }
    try {
      await submit({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        email: form.email || undefined,
        idNumber: form.idNumber || undefined,
        position: form.position || undefined,
        department: form.department || undefined,
        employmentType: form.employmentType,
        paymentTerms: form.paymentTerms,
        baseSalary: form.baseSalary ? Number(form.baseSalary) : undefined,
        hireDate: form.hireDate || undefined,
        notes: form.notes || undefined,
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not add staff'));
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add staff member</DialogTitle>
          <DialogDescription>
            {branchId
              ? 'They will be added to the active branch as an ACTIVE employee.'
              : 'Select a branch first from the branch switcher.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2 p-6 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name *</Label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => setField('firstName', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name *</Label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(e) => setField('lastName', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              value={form.position}
              onChange={(e) => setField('position', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={form.department}
              onChange={(e) => setField('department', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="employmentType">Employment type</Label>
            <div className="relative">
              <select
                id="employmentType"
                value={form.employmentType}
                onChange={(e) =>
                  setField('employmentType', e.target.value as EmploymentType)
                }
                className="flex h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 py-2 pr-9 text-sm text-foreground shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                <ChevronDown className="h-4 w-4 opacity-60" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paymentTerms">Payment terms</Label>
            <div className="relative">
              <select
                id="paymentTerms"
                value={form.paymentTerms}
                onChange={(e) =>
                  setField('paymentTerms', e.target.value as StaffPaymentTerms)
                }
                className="flex h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 py-2 pr-9 text-sm text-foreground shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {PAYMENT_TERMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                <ChevronDown className="h-4 w-4 opacity-60" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="baseSalary">Base salary (KES)</Label>
            <Input
              id="baseSalary"
              type="number"
              min={0}
              value={form.baseSalary}
              onChange={(e) => setField('baseSalary', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hireDate">Hire date</Label>
            <Input
              id="hireDate"
              type="date"
              value={form.hireDate}
              onChange={(e) => setField('hireDate', e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="idNumber">ID number</Label>
            <Input
              id="idNumber"
              value={form.idNumber}
              onChange={(e) => setField('idNumber', e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="brand"
            onClick={() => void onSave()}
            loading={pending}
            disabled={!branchId || pending}
          >
            Add staff
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Payroll ─────────────────────────────────────────────────────────────────

export function AdminHrPayroll() {
  const branchId = useBranchStore((s) => s.activeBranchId) ?? '';
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [status, setStatus] = useState<'all' | 'DRAFT' | 'APPROVED' | 'PAID'>(
    'all',
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const query = useHrPayroll({
    search: debouncedSearch,
    // DTO expects periodMonth / periodYear; earlier iteration sent
    // month / year and 400'd the page.
    periodMonth: month,
    periodYear: year,
    status: status === 'all' ? undefined : status,
    page,
    limit: perPage,
  });

  const [showRun, setShowRun] = useState(false);
  const createRun = useCreatePayrollRun();

  const columns: ErpColumn<PayrollRun>[] = [
    {
      key: 'ref',
      header: 'Reference',
      cell: (r) => (
        <span className="font-mono text-xs">{r.reference ?? '—'}</span>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      cell: (r) => (
        <span className="font-medium">
          {MONTH_LABELS[(r.periodMonth ?? 1) - 1]} {r.periodYear}
        </span>
      ),
    },
    {
      key: 'entries',
      header: 'Employees',
      cell: (r) => r._count?.entries ?? r.staffCount ?? '—',
    },
    {
      key: 'gross',
      header: <span className="text-right block">Total Gross</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums">
          {formatKsh(r.totalGross ?? 0)}
        </span>
      ),
    },
    {
      key: 'net',
      header: <span className="text-right block">Total Net</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums font-semibold">
          {formatKsh(r.totalNet ?? 0)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge
          variant={
            r.status === 'PAID'
              ? 'success'
              : r.status === 'APPROVED'
                ? 'brand'
                : r.status === 'PENDING_APPROVAL'
                  ? 'warning'
                  : r.status === 'CANCELLED'
                    ? 'destructive'
                    : 'mineral'
          }
        >
          {r.status ?? 'DRAFT'}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <ErpListPage
        title="Payroll"
        description="Payroll runs and staff payments."
        kpis={[
          {
            label: 'Runs (filtered)',
            value: query.data?.meta?.total ?? 0,
            accent: 'brand',
            icon: <BadgeDollarSign className="h-4 w-4" />,
          },
        ]}
        actions={
          <Button
            size="sm"
            variant="brand"
            leftIcon={<DollarSign className="h-4 w-4" />}
            onClick={() => setShowRun(true)}
            disabled={!branchId}
          >
            Run Payroll
          </Button>
        }
        searchPlaceholder="Search reference…"
        extraFilters={
          <>
            <select
              value={month}
              onChange={(e) => {
                setMonth(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            >
              {MONTHS_LONG.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => {
                setYear(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            >
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </>
        }
        filterChips={[
          { key: 'all', label: 'All Status' },
          { key: 'DRAFT', label: 'Draft' },
          { key: 'APPROVED', label: 'Approved' },
          { key: 'PAID', label: 'Paid' },
        ]}
        filterValue={status}
        onFilterChange={(k) => {
          setStatus(k as typeof status);
          setPage(1);
        }}
        columns={columns}
        query={query}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
        emptyLabel="No payroll runs yet"
        rowKey={(r) => r.id}
      />

      {showRun && (
        <RunPayrollDialog
          branchId={branchId}
          defaultMonth={month}
          defaultYear={year}
          pending={createRun.isPending}
          onClose={() => setShowRun(false)}
          submit={async ({ periodMonth, periodYear, notes }) => {
            try {
              await createRun.mutateAsync({
                branchId,
                periodMonth,
                periodYear,
                notes,
              });
              toast.success(
                `Payroll drafted for ${MONTHS_LONG[periodMonth - 1]} ${periodYear}`,
              );
              setShowRun(false);
            } catch (err) {
              toast.error(getApiErrorMessage(err, 'Could not draft payroll'));
            }
          }}
        />
      )}
    </>
  );
}

function RunPayrollDialog({
  branchId,
  defaultMonth,
  defaultYear,
  pending,
  onClose,
  submit,
}: {
  branchId: string;
  defaultMonth: number;
  defaultYear: number;
  pending: boolean;
  onClose: () => void;
  submit: (v: {
    periodMonth: number;
    periodYear: number;
    notes?: string;
  }) => Promise<void>;
}) {
  const [periodMonth, setPeriodMonth] = useState(defaultMonth);
  const [periodYear, setPeriodYear] = useState(defaultYear);
  const [notes, setNotes] = useState('');

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Draft a payroll run</DialogTitle>
          <DialogDescription>
            Creates a DRAFT run for the selected month. It aggregates every
            ACTIVE staff member&apos;s base salary as the seed totals — HR then
            edits per-employee entries before approval and payment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2 p-6 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="pmonth">Month</Label>
            <div className="relative">
              <select
                id="pmonth"
                value={periodMonth}
                onChange={(e) => setPeriodMonth(Number(e.target.value))}
                className="flex h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 py-2 pr-9 text-sm text-foreground shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {MONTHS_LONG.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                <ChevronDown className="h-4 w-4 opacity-60" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pyear">Year</Label>
            <Input
              id="pyear"
              type="number"
              min={2000}
              max={2100}
              value={periodYear}
              onChange={(e) => setPeriodYear(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pnotes">Notes (optional)</Label>
            <Textarea
              id="pnotes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="brand"
            loading={pending}
            disabled={!branchId || pending}
            onClick={() =>
              void submit({
                periodMonth,
                periodYear,
                notes: notes || undefined,
              })
            }
          >
            Draft run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Leave Management ────────────────────────────────────────────────────────

export function AdminHrLeave() {
  const branchId = useBranchStore((s) => s.activeBranchId) ?? '';
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState<
    'all' | 'PENDING' | 'APPROVED' | 'DENIED' | 'OVERDUE'
  >('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const query = useHrLeave({
    search: debouncedSearch,
    status:
      status === 'all' ? undefined : status === 'OVERDUE' ? undefined : status,
    overdue: status === 'OVERDUE' ? true : undefined,
    page,
    limit: perPage,
  });

  const items = query.data?.data ?? [];
  // Real KPIs derived from the current page so the numbers move with the
  // filters — better than always showing "—".
  const approvedCount = items.filter((r) => r.status === 'APPROVED').length;
  const onLeaveNowCount = items.filter((r) => {
    if (r.status !== 'APPROVED') return false;
    const now = Date.now();
    return (
      new Date(r.startDate).getTime() <= now &&
      new Date(r.endDate).getTime() >= now
    );
  }).length;
  const overdueCount = items.filter(
    (r) =>
      r.status === 'OVERDUE' ||
      (r.status === 'APPROVED' && new Date(r.endDate).getTime() < Date.now()),
  ).length;

  const [showAdd, setShowAdd] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    leave: LeaveRequest;
    verdict: 'APPROVED' | 'DENIED';
  } | null>(null);

  const createLeave = useCreateLeaveRequest();
  const review = useReviewLeaveRequest(reviewTarget?.leave.id ?? '');

  const columns: ErpColumn<LeaveRequest>[] = [
    {
      key: 'staff',
      header: 'Staff Member',
      cell: (r) => (
        <span className="font-medium">
          {r.staffName ??
            (r.staff ? `${r.staff.firstName} ${r.staff.lastName}` : '—')}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (r) => (r.type ? <Badge variant="outline">{r.type}</Badge> : '—'),
    },
    {
      key: 'period',
      header: 'Period',
      cell: (r) => (
        <span className="text-xs">
          {r.startDate} → {r.endDate}
        </span>
      ),
    },
    {
      key: 'days',
      header: <span className="text-right block">Days</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums">{r.days ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge
          variant={
            r.status === 'APPROVED'
              ? 'success'
              : r.status === 'DENIED'
                ? 'destructive'
                : r.status === 'OVERDUE'
                  ? 'destructive'
                  : 'warning'
          }
        >
          {r.status ?? 'PENDING'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (r) => (
        <div className="flex justify-end">
          {r.status === 'PENDING' ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="icon" aria-label="Row actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={4}
                  className="z-50 min-w-[160px] rounded-md border border-border bg-popover p-1 shadow-md"
                >
                  <DropdownMenu.Item
                    onSelect={() =>
                      setReviewTarget({ leave: r, verdict: 'APPROVED' })
                    }
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted"
                  >
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Approve
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() =>
                      setReviewTarget({ leave: r, verdict: 'DENIED' })
                    }
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-muted"
                  >
                    <XCircle className="h-4 w-4" />
                    Deny
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <span className="text-xs text-muted-foreground pr-2">—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <ErpListPage
        title="Leave Management"
        description="Staff leave requests and approvals."
        kpis={[
          {
            label: 'Approved (page)',
            value: approvedCount,
            accent: 'success',
            icon: <CheckCircle2 className="h-4 w-4" />,
          },
          {
            label: 'On Leave Now',
            value: onLeaveNowCount,
            accent: 'warning',
            icon: <CalendarDays className="h-4 w-4" />,
          },
          {
            label: 'Overdue',
            value: overdueCount,
            accent: 'destructive',
            icon: <AlertTriangle className="h-4 w-4" />,
          },
        ]}
        actions={
          <Button
            size="sm"
            variant="brand"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAdd(true)}
            disabled={!branchId}
          >
            Request leave
          </Button>
        }
        searchPlaceholder="Search name, type or reason…"
        filterChips={[
          { key: 'all', label: 'All' },
          { key: 'PENDING', label: 'Pending' },
          { key: 'APPROVED', label: 'Approved' },
          { key: 'DENIED', label: 'Denied' },
          { key: 'OVERDUE', label: 'Overdue' },
        ]}
        filterValue={status}
        onFilterChange={(k) => {
          setStatus(k as typeof status);
          setPage(1);
        }}
        columns={columns}
        query={query}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
        emptyLabel="No leave requests yet"
        rowKey={(r) => r.id}
      />

      {showAdd && (
        <AddLeaveDialog
          branchId={branchId}
          pending={createLeave.isPending}
          onClose={() => setShowAdd(false)}
          submit={async (payload) => {
            try {
              await createLeave.mutateAsync({ ...payload, branchId });
              toast.success('Leave request submitted');
              setShowAdd(false);
            } catch (err) {
              toast.error(getApiErrorMessage(err, 'Submission failed'));
            }
          }}
        />
      )}

      {reviewTarget && (
        <ReviewLeaveDialog
          leave={reviewTarget.leave}
          verdict={reviewTarget.verdict}
          pending={review.isPending}
          onClose={() => setReviewTarget(null)}
          submit={async (comments) => {
            try {
              await review.mutateAsync({
                status: reviewTarget.verdict,
                comments,
              });
              toast.success(
                reviewTarget.verdict === 'APPROVED'
                  ? 'Leave approved'
                  : 'Leave denied',
              );
              setReviewTarget(null);
            } catch (err) {
              toast.error(getApiErrorMessage(err, 'Review failed'));
            }
          }}
        />
      )}
    </>
  );
}

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  COMPASSIONATE: 'Compassionate Leave',
  UNPAID: 'Unpaid Leave',
  STUDY: 'Study Leave',
  OTHER: 'Other / Special Leave',
};

function AddLeaveDialog({
  branchId,
  pending,
  onClose,
  submit,
}: {
  branchId: string;
  pending: boolean;
  onClose: () => void;
  submit: (v: {
    staffId: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason?: string;
  }) => Promise<void>;
}) {
  const [staffId, setStaffId] = useState('');
  const [type, setType] = useState<LeaveType>('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const staffQuery = useHrStaff({ limit: 200 });
  const staffList = staffQuery.data?.data ?? [];

  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : null;
  }, [startDate, endDate]);

  const onSave = () => {
    if (!staffId) {
      toast.error('Please select a staff member');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Start date and end date are required');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date cannot be earlier than start date');
      return;
    }
    void submit({
      staffId,
      type,
      startDate,
      endDate,
      reason: reason.trim() || undefined,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden p-0 sm:max-w-xl">
        {/* Header with Icon & Context */}
        <div className="border-b border-border/80 bg-muted/30 p-6 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Request Leave
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs text-muted-foreground">
                {branchId
                  ? 'Submit a staff leave application for administrative review and approval.'
                  : 'Select a branch first from the branch switcher.'}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Notice & Duration banner */}
        <div className="mx-6 mt-4 flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Queue status: <strong className="font-semibold">
              PENDING
            </strong>{' '}
            approval
          </span>
          {calculatedDays !== null && (
            <Badge variant="mineral" className="font-mono text-xs">
              {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}
            </Badge>
          )}
        </div>

        {/* Form Body with generous spacing & clean layout */}
        <div className="space-y-4 p-6 pt-4">
          {/* Staff Member Field */}
          <div className="space-y-1.5">
            <Label
              htmlFor="lstaff"
              className="text-xs font-semibold text-foreground"
            >
              Staff member <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <select
                id="lstaff"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="flex h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 py-2 pr-9 text-sm text-foreground shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={staffQuery.isPending}
              >
                <option value="">
                  {staffQuery.isPending
                    ? 'Loading staff roster…'
                    : 'Select staff member…'}
                </option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName ?? `${s.firstName} ${s.lastName}`}
                    {s.staffNumber ? ` (${s.staffNumber})` : ''}
                    {s.position ? ` — ${s.position}` : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                <ChevronDown className="h-4 w-4 opacity-60" />
              </div>
            </div>
          </div>

          {/* Leave Type */}
          <div className="space-y-1.5">
            <Label
              htmlFor="ltype"
              className="text-xs font-semibold text-foreground"
            >
              Leave type <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <select
                id="ltype"
                value={type}
                onChange={(e) => setType(e.target.value as LeaveType)}
                className="flex h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 py-2 pr-9 text-sm text-foreground shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {LEAVE_TYPE_LABELS[t] ?? t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                <ChevronDown className="h-4 w-4 opacity-60" />
              </div>
            </div>
          </div>

          {/* Start Date & End Date side by side */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="lstart"
                className="text-xs font-semibold text-foreground"
              >
                Start date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lstart"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                className="h-10 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="lend"
                className="text-xs font-semibold text-foreground"
              >
                End date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lend"
                type="date"
                min={startDate || undefined}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Reason / Notes */}
          <div className="space-y-1.5">
            <Label
              htmlFor="lreason"
              className="text-xs font-semibold text-foreground"
            >
              Reason / Notes{' '}
              <span className="text-xs font-normal text-muted-foreground">
                (Optional)
              </span>
            </Label>
            <Textarea
              id="lreason"
              rows={3}
              placeholder="Provide handover context, coverage plan, or reason for this leave request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border/80 bg-muted/20 p-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="brand"
            onClick={onSave}
            loading={pending}
            disabled={!branchId || pending}
            leftIcon={<CalendarDays className="h-4 w-4" />}
          >
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReviewLeaveDialog({
  leave,
  verdict,
  pending,
  onClose,
  submit,
}: {
  leave: LeaveRequest;
  verdict: 'APPROVED' | 'DENIED';
  pending: boolean;
  onClose: () => void;
  submit: (comments?: string) => Promise<void>;
}) {
  const [comments, setComments] = useState('');
  const approving = verdict === 'APPROVED';

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden p-0 sm:max-w-xl">
        <div className="border-b border-border/80 bg-muted/30 p-6 pb-5">
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                approving
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-destructive/10 text-destructive',
              )}
            >
              {approving ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                {approving ? 'Approve' : 'Deny'} Leave Request
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs text-muted-foreground">
                {leave.staffName ??
                  (leave.staff
                    ? `${leave.staff.firstName} ${leave.staff.lastName}`
                    : 'Staff')}
                {' · '}
                {leave.type
                  ? (LEAVE_TYPE_LABELS[leave.type] ?? leave.type)
                  : 'Leave'}
                {' · '}
                {leave.startDate} → {leave.endDate} ({leave.days ?? '—'} days)
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="space-y-1.5">
            <Label
              htmlFor="rcomments"
              className="text-xs font-semibold text-foreground"
            >
              {approving
                ? 'Approval comments (optional)'
                : 'Reason for denial *'}
            </Label>
            <Textarea
              id="rcomments"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                approving
                  ? 'e.g. Approved. Ensure full handover to the team before departure.'
                  : 'e.g. Overlaps with scheduled plant maintenance window. Please reschedule.'
              }
              className="resize-none rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border/80 bg-muted/20 p-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant={approving ? 'brand' : 'destructive'}
            leftIcon={
              approving ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <ShieldAlert className="h-4 w-4" />
              )
            }
            loading={pending}
            disabled={pending || (!approving && comments.trim().length === 0)}
            onClick={() => void submit(comments || undefined)}
          >
            {approving ? 'Approve Leave' : 'Deny Leave'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
