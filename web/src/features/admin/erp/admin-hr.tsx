'use client';

import { useState } from 'react';
import { Users, CalendarDays, CheckCircle2, AlertTriangle, Plus, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import {
  KpiRow,
  formatKsh,
} from '@/components/admin/erp-list-shell';
import {
  useHrStaff,
  useHrOverview,
  useHrPayroll,
  useHrLeave,
  type StaffMember,
  type PayrollRecord,
  type LeaveRequest,
} from '@/lib/api/hooks/use-hr';
import { formatRelativeDate } from '@/lib/utils';

export function AdminHrOverview() {
  const { data, isLoading, isError, refetch } = useHrOverview();
  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;
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
            value: data?.totalStaff ?? 0,
            icon: <Users className="h-4 w-4" />,
            accent: 'brand',
          },
          {
            label: 'Active',
            value: data?.activeStaff ?? 0,
            icon: <CheckCircle2 className="h-4 w-4" />,
            accent: 'success',
          },
          {
            label: 'On Leave',
            value: data?.onLeave ?? 0,
            icon: <CalendarDays className="h-4 w-4" />,
            accent: 'warning',
          },
          {
            label: 'Users',
            value: data?.usersCount ?? 0,
            icon: <Users className="h-4 w-4" />,
            accent: 'default',
          },
        ]}
      />
      {(!data || Object.keys(data).length === 0) && (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No HR data yet"
          description="Data will appear here once staff records are created."
        />
      )}
    </div>
  );
}

export function AdminHrStaff() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const query = useHrStaff({ search, page, limit: perPage });

  const columns: ErpColumn<StaffMember>[] = [
    {
      key: 'name',
      header: 'Staff',
      cell: (r) => <span className="font-medium">{r.fullName}</span>,
    },
    { key: 'role', header: 'Role', cell: (r) => r.role ?? '—' },
    { key: 'dept', header: 'Department', cell: (r) => r.department ?? '—' },
    { key: 'phone', header: 'Phone', cell: (r) => r.phone ?? '—' },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge
          variant={
            r.status === 'active'
              ? 'success'
              : r.status === 'on-leave'
                ? 'warning'
                : 'mineral'
          }
        >
          {r.status ?? '—'}
        </Badge>
      ),
    },
  ];

  return (
    <ErpListPage
      title="Manage Staff"
      description="Employees and users at the active branch."
      actions={
        <Button size="sm" variant="brand" leftIcon={<Plus className="h-4 w-4" />}>
          Add Staff
        </Button>
      }
      searchPlaceholder="Search name, role, department…"
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
  );
}

const MONTHS = [
  'January','February','March','April','May','June','July','August','September','October','November','December',
];

export function AdminHrPayroll() {
  const [search, setSearch] = useState('');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [status, setStatus] = useState<'all' | 'draft' | 'approved' | 'paid'>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const query = useHrPayroll({ search, month, year, status, page, limit: perPage });

  const columns: ErpColumn<PayrollRecord>[] = [
    { key: 'staff', header: 'Staff', cell: (r) => <span className="font-medium">{r.staffName}</span> },
    { key: 'period', header: 'Period', cell: (r) => r.period },
    {
      key: 'gross',
      header: <span className="text-right block">Gross</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums">{formatKsh(r.grossPay)}</span>
      ),
    },
    {
      key: 'net',
      header: <span className="text-right block">Net</span>,
      cell: (r) => (
        <span className="text-right block tabular-nums font-semibold">
          {formatKsh(r.netPay)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge
          variant={
            r.status === 'paid' ? 'success' : r.status === 'approved' ? 'brand' : 'warning'
          }
        >
          {r.status ?? 'draft'}
        </Badge>
      ),
    },
  ];

  return (
    <ErpListPage
      title="Payroll"
      description="Payroll runs and staff payments."
      kpis={[
        {
          label: 'Staff (This Month)',
          value: query.data?.meta?.total ?? 0,
          accent: 'brand',
        },
      ]}
      searchPlaceholder="Search by staff name…"
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
            {MONTHS.map((m, i) => (
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
          <Button size="sm" variant="brand" leftIcon={<DollarSign className="h-4 w-4" />}>
            Run Payroll
          </Button>
        </>
      }
      filterChips={[
        { key: 'all', label: 'All Status' },
        { key: 'draft', label: 'Draft' },
        { key: 'approved', label: 'Approved' },
        { key: 'paid', label: 'Paid' },
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
      emptyLabel="No payroll records yet"
      rowKey={(r) => r.id}
    />
  );
}

export function AdminHrLeave() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'denied' | 'overdue'>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const query = useHrLeave({ search, status, page, limit: perPage });

  const columns: ErpColumn<LeaveRequest>[] = [
    { key: 'staff', header: 'Staff Member', cell: (r) => <span className="font-medium">{r.staffName}</span> },
    {
      key: 'type',
      header: 'Type',
      cell: (r) => r.leaveType ? <Badge variant="outline">{r.leaveType}</Badge> : '—',
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
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge
          variant={
            r.status === 'approved'
              ? 'success'
              : r.status === 'denied'
                ? 'destructive'
                : r.status === 'overdue'
                  ? 'destructive'
                  : 'warning'
          }
        >
          {r.status ?? 'pending'}
        </Badge>
      ),
    },
  ];

  return (
    <ErpListPage
      title="Leave Management"
      description="Staff leave requests and approvals."
      kpis={[
        { label: 'Approved', value: '—', accent: 'success', icon: <CheckCircle2 className="h-4 w-4" /> },
        { label: 'On Leave Now', value: '—', accent: 'warning', icon: <CalendarDays className="h-4 w-4" /> },
        { label: 'Overdue', value: '—', accent: 'destructive', icon: <AlertTriangle className="h-4 w-4" /> },
      ]}
      searchPlaceholder="Search name, type or reason…"
      filterChips={[
        { key: 'all', label: 'All' },
        { key: 'pending', label: 'Pending' },
        { key: 'approved', label: 'Approved' },
        { key: 'denied', label: 'Denied' },
        { key: 'overdue', label: 'Overdue' },
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
  );
}
