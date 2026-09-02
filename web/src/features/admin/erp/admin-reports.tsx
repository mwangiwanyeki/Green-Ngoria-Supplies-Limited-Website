'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Download,
  FileJson,
  Printer,
  TrendingUp,
  Wallet,
  PiggyBank,
  ShoppingBag,
  Boxes,
  HandCoins,
  PackageX,
  Users,
  Landmark,
  BarChart3,
  Receipt,
} from 'lucide-react';
import { Input, Label } from '@/components/ui/input';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { PageSkeleton } from '@/components/ui/skeleton';
import { KpiRow, formatKsh } from '@/components/admin/erp-list-shell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBranchStore } from '@/stores/branch-store';
import {
  useReportsOverview,
  type ReportRange,
  type ReportsOverview,
} from '@/lib/api/hooks/use-reports';
import { toCsv, downloadCsv, type CsvCell } from '@/lib/export-csv';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const RANGES: [ReportRange, string][] = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['week', 'This Week'],
  ['month', 'This Month'],
  ['custom', 'Custom…'],
];

/** `2026-08` → `Aug 2026`, for chart axes and CSV rows. */
function formatMonth(key: string): string {
  const [year, month] = key.split('-').map(Number);
  if (!year || !month) return key;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-KE', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Flattens the live report into the rows written to the CSV file. */
function buildCsvRows(report: ReportsOverview): CsvCell[][] {
  const rows: CsvCell[][] = [
    ['Green Ngoria — ERP Reports Overview'],
    ['Period', `${formatDay(report.from)} to ${formatDay(report.to)}`],
    ['Range', report.range],
    ['Branch', report.branchId],
    ['Generated', new Date().toISOString()],
    [],
    ['Metric', 'Value'],
    ['Total revenue (KES)', report.totalRevenue],
    ['Transactions', report.ordersCount],
    ['Average transaction value (KES)', report.avgOrderValue],
    ['Total expenses (KES)', report.totalExpenses],
    ['Expense records', report.expenseRecords],
    ['Net profit (KES)', report.netProfit],
    ['Profit margin (%)', report.profitMargin],
    ['Stock on hand value (KES)', report.stockValue],
    ['Stock items', report.stockItems],
    ['Low stock items', report.lowStock],
    ['Out of stock items', report.outOfStock],
    ['Outstanding receivables (KES)', report.outstandingDebt],
    ['Overdue debt accounts', report.debtOverdue],
    ['Cash & bank balance (KES)', report.cashBalance],
    ['Financial accounts', report.accountsCount],
    ['Customers', report.customersCount],
    ['Staff headcount', report.staffCount],
    [],
    ['Month', 'Revenue (KES)', 'Expenses (KES)'],
    ...report.monthly.map((m) => [formatMonth(m.month), m.revenue, m.expenses]),
  ];

  if (report.expensesByCategory.length > 0) {
    rows.push([], ['Expense category', 'Total (KES)']);
    for (const c of report.expensesByCategory) rows.push([c.name, c.total]);
  }
  return rows;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AdminReports() {
  const [range, setRange] = useState<ReportRange>('month');
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customTo, setCustomTo] = useState<string>(todayIso);
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  const { data, isPending, isError, refetch } = useReportsOverview({
    range,
    from: range === 'custom' ? customFrom : undefined,
    to: range === 'custom' ? customTo : undefined,
  });

  const chartData = useMemo(
    () =>
      (data?.monthly ?? []).map((m) => ({
        month: formatMonth(m.month),
        revenue: m.revenue,
        expenses: m.expenses,
      })),
    [data?.monthly],
  );

  const hasTrend = chartData.some((m) => m.revenue > 0 || m.expenses > 0);
  const expenseCategories = data?.expensesByCategory ?? [];
  const largestCategory = expenseCategories[0]?.total ?? 0;

  const handleExportCsv = () => {
    if (!data) return;
    downloadCsv(
      `gng-reports-${data.range}-${data.to.slice(0, 10)}.csv`,
      toCsv(buildCsvRows(data)),
    );
    toast.success('Report exported as CSV');
  };

  const handleExportJson = () => {
    if (!data) return;
    const blob = new Blob(
      [JSON.stringify({ generatedAt: new Date().toISOString(), ...data }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gng-reports-${data.range}-${data.to.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report exported as JSON');
  };

  // Print + Save-as-PDF both hit window.print. A `.printing` class on <html>
  // is added briefly so a scoped print stylesheet (in globals.css) can hide
  // the sidebar/header/nav and keep only .print-area — the browser's built-in
  // Save-as-PDF then produces a clean PDF from the same output.
  const handlePrint = (mode: 'print' | 'pdf') => {
    if (!data) return;
    if (typeof document === 'undefined') return;
    document.documentElement.classList.add('printing');
    document.title =
      mode === 'pdf'
        ? `Green Ngoria Report — ${data.from} to ${data.to}`
        : document.title;
    try {
      window.print();
    } finally {
      // Some browsers fire afterprint asynchronously; the class is also
      // removed by the afterprint listener below just in case.
      setTimeout(() => {
        document.documentElement.classList.remove('printing');
      }, 500);
    }
    if (mode === 'pdf') {
      toast.info('Choose "Save as PDF" as the destination in the print dialog.');
    }
  };

  // Cleanup: browsers fire "afterprint" when the dialog closes / prints.
  if (typeof window !== 'undefined') {
    window.onafterprint = () =>
      document.documentElement.classList.remove('printing');
  }

  const header = (
    <PageHeader
      title="Enterprise Reports & Financial Intelligence"
      description="Cross-module KPIs aggregated live from sales, expenses, inventory, receivables, accounts and HR for the active branch."
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="h-4 w-4" />}
            onClick={() => handlePrint('print')}
            disabled={!data}
          >
            Print
          </Button>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="brand"
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
                disabled={!data}
              >
                Download
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className="z-50 min-w-[200px] rounded-md border border-border bg-popover p-1 shadow-md"
              >
                <DropdownMenu.Item
                  onSelect={handleExportCsv}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted"
                >
                  <Download className="h-4 w-4 text-brand-500" />
                  Export CSV
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={handleExportJson}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted"
                >
                  <FileJson className="h-4 w-4 text-brand-500" />
                  Export JSON (raw)
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={() => handlePrint('pdf')}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted"
                >
                  <Printer className="h-4 w-4 text-brand-500" />
                  Save as PDF
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </>
      }
    />
  );

  if (!activeBranchId) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        {header}
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="No branch selected"
          description="Reports are scoped to a single branch. Pick a branch to load its figures."
        />
      </div>
    );
  }

  if (isPending) return <PageSkeleton />;

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        {header}
        <ErrorState
          title="Could not load reports"
          description="The reports overview could not be fetched for this branch."
          retry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 print-area">
      {header}

      <div className="flex flex-wrap items-center gap-2 no-print">
        {RANGES.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setRange(key)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              range === key
                ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold'
                : 'border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
        {range === 'custom' && (
          <>
            <div className="flex items-center gap-1.5 ml-2">
              <Label htmlFor="from" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="from"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 text-xs w-[140px]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Label htmlFor="to" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="to"
                type="date"
                value={customTo}
                min={customFrom}
                max={todayIso()}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 text-xs w-[140px]"
              />
            </div>
          </>
        )}
        <span className="ml-1 text-xs text-muted-foreground">
          {formatDay(data.from)} – {formatDay(data.to)}
        </span>
      </div>

      {/* Print-only header block: shown only when printing (via a scoped
        * @media print rule) so exported PDFs include the branding and period. */}
      <div className="hidden print:block border-b border-hairline pb-3 mb-2">
        <h1 className="text-2xl font-semibold">Green Ngoria Supplies Limited</h1>
        <p className="text-sm text-muted-foreground">
          Enterprise Reports · {formatDay(data.from)} – {formatDay(data.to)} ·
          generated {new Date().toLocaleString('en-KE')}
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Executive Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
          <TabsTrigger value="inventory">Inventory & Assets</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <KpiRow
            items={[
              {
                label: 'Total Revenue',
                value: formatKsh(data.totalRevenue),
                sub: `${data.ordersCount} transaction${data.ordersCount === 1 ? '' : 's'}`,
                icon: <TrendingUp className="h-4 w-4" />,
                accent: 'brand',
              },
              {
                label: 'Total Expenses',
                value: formatKsh(data.totalExpenses),
                sub: `${data.expenseRecords} logged record${data.expenseRecords === 1 ? '' : 's'}`,
                icon: <Wallet className="h-4 w-4" />,
                accent: 'destructive',
              },
              {
                label: 'Net Operating Profit',
                value: formatKsh(data.netProfit),
                sub: `${data.profitMargin.toFixed(1)}% margin`,
                icon: <PiggyBank className="h-4 w-4" />,
                accent: Number(data.netProfit) < 0 ? 'destructive' : 'success',
              },
              {
                label: 'Avg Transaction Value',
                value: formatKsh(data.avgOrderValue),
                icon: <ShoppingBag className="h-4 w-4" />,
                accent: 'default',
              },
              {
                label: 'Physical Stock Value',
                value: formatKsh(data.stockValue),
                sub: `${data.stockItems} item${data.stockItems === 1 ? '' : 's'} catalogued`,
                icon: <Boxes className="h-4 w-4" />,
                accent: 'brand',
              },
              {
                label: 'Outstanding Receivables',
                value: formatKsh(data.outstandingDebt),
                sub: `${data.debtOverdue} overdue account${data.debtOverdue === 1 ? '' : 's'}`,
                icon: <HandCoins className="h-4 w-4" />,
                accent: 'warning',
              },
              {
                label: 'Low / Out of Stock',
                value: `${data.lowStock} low · ${data.outOfStock} out`,
                icon: <PackageX className="h-4 w-4" />,
                accent: 'destructive',
              },
              {
                label: 'Customers',
                value: data.customersCount,
                sub: `${data.staffCount} staff on headcount`,
                icon: <Users className="h-4 w-4" />,
                accent: 'default',
              },
            ]}
          />

          <div className="glass-card rounded-xl p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold">
                Revenue vs Operating Expenses (KES Monthly)
              </h2>
              <p className="text-xs text-muted-foreground">
                Trailing 12 months of recorded sales and expenses for this
                branch.
              </p>
            </div>
            {hasTrend ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.4}
                    />
                    <XAxis
                      dataKey="month"
                      className="fill-muted-foreground text-xs"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      className="fill-muted-foreground text-xs"
                      tickFormatter={(v: number) =>
                        formatKsh(v, { compact: true })
                      }
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(v: number) => formatKsh(v)}
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      fill="#14b8a6"
                      name="Revenue (KES)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expenses"
                      fill="#f43f5e"
                      name="Expenses (KES)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={<BarChart3 className="h-6 w-6" />}
                title="No sales or expenses recorded"
                description="Nothing has been posted for this branch in the last 12 months, so there is no trend to chart yet."
              />
            )}
          </div>
        </TabsContent>

        {/* ── EXPENSES TAB ── */}
        <TabsContent value="expenses" className="space-y-6 mt-4">
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-semibold text-sm mb-1">
              Operating Cost Categorization
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Recorded expenses for {formatDay(data.from)} –{' '}
              {formatDay(data.to)}, grouped by expense category.
            </p>
            {expenseCategories.length > 0 ? (
              <div className="space-y-4">
                {expenseCategories.map((exp) => (
                  <div
                    key={exp.categoryId ?? 'uncategorised'}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{exp.name}</span>
                      <span className="font-semibold tabular-nums">
                        {formatKsh(exp.total)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{
                          width: `${largestCategory > 0 ? (exp.total / largestCategory) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div className="mt-2 pt-4 border-t border-border flex items-center justify-between text-sm font-semibold">
                  <span>Total expenses this period</span>
                  <span className="tabular-nums">
                    {formatKsh(data.totalExpenses)}
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<Receipt className="h-6 w-6" />}
                title="No expenses in this period"
                description="Nothing has been logged for the selected date range."
              />
            )}
          </div>
        </TabsContent>

        {/* ── INVENTORY TAB ── */}
        <TabsContent value="inventory" className="space-y-6 mt-4">
          <KpiRow
            items={[
              {
                label: 'Stock on Hand Value',
                value: formatKsh(data.stockValue),
                icon: <Boxes className="h-4 w-4" />,
                accent: 'brand',
              },
              {
                label: 'Items Catalogued',
                value: data.stockItems,
                icon: <Boxes className="h-4 w-4" />,
                accent: 'default',
              },
              {
                label: 'Low Stock',
                value: data.lowStock,
                sub: 'At or below reorder level',
                icon: <PackageX className="h-4 w-4" />,
                accent: 'warning',
              },
              {
                label: 'Out of Stock',
                value: data.outOfStock,
                icon: <PackageX className="h-4 w-4" />,
                accent: 'destructive',
              },
              {
                label: 'Cash & Bank Balance',
                value: formatKsh(data.cashBalance),
                sub: `${data.accountsCount} financial account${data.accountsCount === 1 ? '' : 's'}`,
                icon: <Landmark className="h-4 w-4" />,
                accent: 'success',
              },
            ]}
          />
          {data.stockItems === 0 && (
            <EmptyState
              icon={<Boxes className="h-6 w-6" />}
              title="No inventory items"
              description="No stock has been catalogued for this branch yet. Add items under Inventory to populate this view."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
