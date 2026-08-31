'use client';

import { useState, useMemo } from 'react';
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
import { Download, TrendingUp, Wallet, PiggyBank, ShoppingBag, Boxes, HandCoins, PackageX, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, EmptyState } from '@/components/ui/page-header';
import { KpiRow, formatKsh } from '@/components/admin/erp-list-shell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useErpResource } from '@/lib/api/hooks/use-erp';
import { cn } from '@/lib/utils';

type Range = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

interface ReportsData {
  totalRevenue?: number | string;
  ordersCount?: number;
  totalExpenses?: number | string;
  expenseRecords?: number;
  netProfit?: number | string;
  profitMargin?: number;
  avgOrderValue?: number | string;
  stockValue?: number | string;
  stockItems?: number;
  outstandingDebt?: number | string;
  debtOverdue?: number;
  lowStock?: number;
  outOfStock?: number;
  customersCount?: number;
  staffCount?: number;
  monthly?: Array<{ month: string; revenue: number; expenses: number }>;
}

export function AdminReports() {
  const [range, setRange] = useState<Range>('month');
  const { data } = useErpResource<ReportsData>('erp/reports/overview', { range });
  const chartData = useMemo(() => data?.monthly ?? [], [data?.monthly]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Reports"
        description="Cross-module KPIs, revenue vs expenses and detail breakdowns."
        actions={
          <Button size="sm" variant="brand" leftIcon={<Download className="h-4 w-4" />}>
            Generate Report
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ['today', 'Today'],
            ['yesterday', 'Yesterday'],
            ['week', 'This Week'],
            ['month', 'This Month'],
            ['custom', 'Custom'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setRange(key)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              range === key
                ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                : 'border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <KpiRow
            items={[
              {
                label: 'Total Revenue',
                value: formatKsh(data?.totalRevenue ?? 0),
                sub: `${data?.ordersCount ?? 0} orders`,
                icon: <TrendingUp className="h-4 w-4" />,
                accent: 'brand',
              },
              {
                label: 'Total Expenses',
                value: formatKsh(data?.totalExpenses ?? 0),
                sub: `${data?.expenseRecords ?? 0} records`,
                icon: <Wallet className="h-4 w-4" />,
                accent: 'destructive',
              },
              {
                label: 'Net Profit',
                value: formatKsh(data?.netProfit ?? 0),
                sub: data?.profitMargin
                  ? `${data.profitMargin.toFixed(1)}% margin`
                  : undefined,
                icon: <PiggyBank className="h-4 w-4" />,
                accent: 'success',
              },
              {
                label: 'Avg Order Value',
                value: formatKsh(data?.avgOrderValue ?? 0),
                icon: <ShoppingBag className="h-4 w-4" />,
                accent: 'default',
              },
              {
                label: 'Stock Value',
                value: formatKsh(data?.stockValue ?? 0),
                sub: `${data?.stockItems ?? 0} items`,
                icon: <Boxes className="h-4 w-4" />,
                accent: 'brand',
              },
              {
                label: 'Outstanding Debt',
                value: formatKsh(data?.outstandingDebt ?? 0),
                sub: data?.debtOverdue ? `${data.debtOverdue} overdue` : undefined,
                icon: <HandCoins className="h-4 w-4" />,
                accent: 'warning',
              },
              {
                label: 'Low / Out of Stock',
                value: `${data?.lowStock ?? 0} / ${data?.outOfStock ?? 0}`,
                sub: `of ${data?.stockItems ?? 0}`,
                icon: <PackageX className="h-4 w-4" />,
                accent: 'destructive',
              },
              {
                label: 'Customers',
                value: data?.customersCount ?? 0,
                sub: `${data?.staffCount ?? 0} staff`,
                icon: <Users className="h-4 w-4" />,
                accent: 'default',
              },
            ]}
          />

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Revenue vs Expenses (Monthly)</h2>
              <p className="text-xs text-muted-foreground">
                Comparison across the trailing months.
              </p>
            </div>
            {chartData.length === 0 ? (
              <EmptyState
                icon={<TrendingUp className="h-6 w-6" />}
                title="No chart data yet"
                description="Chart will populate as sales and expenses are recorded."
              />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="fill-muted-foreground text-xs" />
                    <YAxis
                      className="fill-muted-foreground text-xs"
                      tickFormatter={(v) => formatKsh(v, { compact: true })}
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
                    <Bar dataKey="revenue" fill="hsl(var(--brand-500, 142 71% 25%))" name="Revenue" />
                    <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <EmptyState
            title="Sales detail report"
            description="Detailed sales breakdown appears here once data is available for the selected period."
          />
        </TabsContent>
        <TabsContent value="expenses">
          <EmptyState
            title="Expenses detail report"
            description="Expense category breakdown appears here once data is available."
          />
        </TabsContent>
        <TabsContent value="inventory">
          <EmptyState
            title="Inventory report"
            description="Stock movement and valuation reports appear here."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
