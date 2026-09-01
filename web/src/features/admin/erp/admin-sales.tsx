'use client';

import * as React from 'react';
import {
  Receipt,
  TrendingUp,
  Wallet,
  CreditCard,
  Download,
  Plus,
  Eye,
  Ban,
  RefreshCw,
  X,
  Printer,
  AlertCircle,
  Filter,
  ShoppingCart,
  User,
  Tag,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Input, Label } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { PageSkeleton } from '@/components/ui/skeleton';
import { KpiRow, formatKsh } from '@/components/admin/erp-list-shell';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { SaleReceipt } from './sale-receipt';
import {
  useSales,
  useSale,
  useTodaySalesSummary,
  useRevenueSummary,
  useCreateSale,
  useVoidSale,
  SALE_STATUSES,
  SALE_CHANNELS,
  PAYMENT_METHODS,
  type Sale,
  type SaleStatus,
  type SaleChannel,
  type PaymentMethod,
  type CreateSaleLineItem,
  type CreateSalePayment,
} from '@/lib/api/hooks/use-sales';
import { useErpCustomers } from '@/lib/api/hooks/use-erp-customers';
import { useInventoryItems } from '@/lib/api/hooks/use-inventory';
import { useBranchStore } from '@/stores/branch-store';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { formatDate, formatRelativeDate } from '@/lib/utils';

// ─── Status display helpers ────────────────────────────────────────────────────

const STATUS_LABELS: Record<SaleStatus, string> = {
  DRAFT: 'Draft',
  COMPLETED: 'Completed',
  PARTIALLY_PAID: 'Partial',
  CREDIT: 'Credit',
  VOIDED: 'Voided',
  REFUNDED: 'Refunded',
};

const CHANNEL_LABELS: Record<SaleChannel, string> = {
  POS: 'POS',
  ONLINE: 'Online',
  BACK_OFFICE: 'Back Office',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  MOBILE_MONEY: 'M-Pesa / Mobile',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  OTHER: 'Other',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminSalesProps {
  scope?: 'all' | 'today';
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminSales({ scope = 'all' }: AdminSalesProps) {
  const isToday = scope === 'today';

  // ── List state ──
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [statusFilter, setStatusFilter] = React.useState<SaleStatus | ''>('');
  const [channelFilter, setChannelFilter] = React.useState<SaleChannel | ''>(
    '',
  );
  const [dateFrom, setDateFrom] = React.useState(
    isToday ? format(new Date(), 'yyyy-MM-dd') : '',
  );
  const [dateTo, setDateTo] = React.useState(
    isToday ? format(new Date(), 'yyyy-MM-dd') : '',
  );
  const [showFilters, setShowFilters] = React.useState(false);

  // ── Panel state ──
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [voidTarget, setVoidTarget] = React.useState<Sale | null>(null);
  const [isRefund, setIsRefund] = React.useState(false);
  const [voidReason, setVoidReason] = React.useState('');
  const [showNewSale, setShowNewSale] = React.useState(false);

  // ── Data ──
  const queryParams = {
    search,
    page,
    limit: perPage,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(channelFilter ? { channel: channelFilter } : {}),
    ...(dateFrom ? { from: `${dateFrom}T00:00:00.000Z` } : {}),
    ...(dateTo ? { to: `${dateTo}T23:59:59.999Z` } : {}),
  };

  const query = useSales(queryParams);
  const { data: todaySummary, isLoading: todayLoading } =
    useTodaySalesSummary();
  const { data: revenueSummary } = useRevenueSummary(
    dateFrom || dateTo
      ? {
          from: dateFrom ? `${dateFrom}T00:00:00.000Z` : undefined,
          to: dateTo ? `${dateTo}T23:59:59.999Z` : undefined,
        }
      : undefined,
  );

  // ── KPIs ──
  const kpis = isToday
    ? [
        {
          label: "Today's Revenue",
          value: todayLoading ? '…' : formatKsh(todaySummary?.todayTotal ?? 0),
          sub: `${todaySummary?.saleCount ?? 0} sales`,
          icon: <Receipt className="h-4 w-4" />,
          accent: 'brand' as const,
        },
        {
          label: 'Collected',
          value: formatKsh(todaySummary?.amountCollected ?? 0),
          sub: 'Cash + transfers',
          icon: <Wallet className="h-4 w-4" />,
          accent: 'success' as const,
        },
        {
          label: 'On Credit',
          value: formatKsh(todaySummary?.amountOnCredit ?? 0),
          sub: 'Outstanding balance',
          icon: <CreditCard className="h-4 w-4" />,
          accent: 'warning' as const,
        },
        {
          label: 'Avg Sale',
          value: formatKsh(todaySummary?.averageSale ?? 0),
          icon: <TrendingUp className="h-4 w-4" />,
          accent: 'default' as const,
        },
      ]
    : revenueSummary
      ? [
          {
            label: 'Total Revenue',
            value: formatKsh(revenueSummary.totalRevenue),
            sub: `${revenueSummary.transactionCount} sales`,
            icon: <Receipt className="h-4 w-4" />,
            accent: 'brand' as const,
          },
          {
            label: 'Collected',
            value: formatKsh(revenueSummary.totalCollected),
            icon: <Wallet className="h-4 w-4" />,
            accent: 'success' as const,
          },
          {
            label: 'On Credit',
            value: formatKsh(revenueSummary.totalOnCredit),
            icon: <CreditCard className="h-4 w-4" />,
            accent: 'warning' as const,
          },
          {
            label: 'Avg Sale',
            value: formatKsh(revenueSummary.averageSale),
            icon: <TrendingUp className="h-4 w-4" />,
            accent: 'default' as const,
          },
        ]
      : undefined;

  // ── Columns ──
  const columns: ErpColumn<Sale>[] = [
    {
      key: 'receipt',
      header: 'Receipt',
      cell: (r) => (
        <button
          type="button"
          onClick={() => setDetailId(r.id)}
          className="group flex items-center gap-2 text-left"
        >
          <span className="font-mono text-xs font-semibold text-brand-600 underline-offset-2 group-hover:underline dark:text-brand-400">
            {r.receiptNumber}
          </span>
        </button>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (r) =>
        r.customer ? (
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {r.customer.name}
            </div>
            {r.customer.phone && (
              <div className="truncate text-xs text-muted-foreground">
                {r.customer.phone}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Walk-in</span>
        ),
    },
    {
      key: 'channel',
      header: 'Channel',
      cell: (r) => (
        <Badge variant="outline" className="text-xs">
          {CHANNEL_LABELS[r.channel] ?? r.channel}
        </Badge>
      ),
    },
    {
      key: 'items',
      header: <span className="block text-right">Items</span>,
      cell: (r) => (
        <span className="block text-right tabular-nums text-sm">
          {r._count.lineItems}
        </span>
      ),
    },
    {
      key: 'total',
      header: <span className="block text-right">Total</span>,
      cell: (r) => (
        <span className="block text-right tabular-nums font-semibold text-sm">
          {formatKsh(r.totalAmount)}
        </span>
      ),
    },
    {
      key: 'paid',
      header: <span className="block text-right">Paid</span>,
      cell: (r) => (
        <span
          className={cn(
            'block text-right tabular-nums text-sm',
            Number(r.amountDue) > 0
              ? 'text-warning-foreground'
              : 'text-success',
          )}
        >
          {formatKsh(r.amountPaid)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'when',
      header: 'When',
      cell: (r) => (
        <span
          className="text-xs text-muted-foreground"
          title={formatDate(r.soldAt, 'dd MMM yyyy HH:mm')}
        >
          {formatRelativeDate(r.soldAt)}
        </span>
      ),
    },
    {
      key: 'cashier',
      header: 'Cashier',
      cell: (r) =>
        r.cashier ? (
          <span className="text-xs text-muted-foreground">
            {r.cashier.firstName} {r.cashier.lastName[0]}.
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            title="View sale"
            onClick={() => setDetailId(r.id)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {r.status !== 'VOIDED' && r.status !== 'REFUNDED' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:text-destructive"
              title="Void sale"
              onClick={() => {
                setVoidTarget(r);
                setIsRefund(false);
                setVoidReason('');
              }}
            >
              <Ban className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Filters bar extra controls ──
  const extraFilters = (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={showFilters ? 'brand' : 'outline'}
        onClick={() => setShowFilters((p) => !p)}
        leftIcon={<Filter className="h-3.5 w-3.5" />}
      >
        Filters
        {(statusFilter || channelFilter || dateFrom || dateTo) && (
          <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white">
            {
              [statusFilter, channelFilter, dateFrom || dateTo].filter(Boolean)
                .length
            }
          </span>
        )}
      </Button>
      <Button
        size="sm"
        variant="outline"
        leftIcon={<Download className="h-3.5 w-3.5" />}
        onClick={handleExport}
      >
        Export
      </Button>
    </div>
  );

  // ── Handlers ──
  function handleExport() {
    const rows = query.data?.data ?? [];
    if (rows.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = [
      'Receipt',
      'Date',
      'Customer',
      'Channel',
      'Items',
      'Subtotal',
      'Discount',
      'Tax',
      'Total',
      'Paid',
      'Due',
      'Status',
      'Cashier',
    ];
    const csvRows = rows.map((r) =>
      [
        r.receiptNumber,
        formatDate(r.soldAt, 'dd/MM/yyyy HH:mm'),
        r.customer?.name ?? 'Walk-in',
        r.channel,
        r._count.lineItems,
        Number(r.subtotal).toFixed(2),
        Number(r.discountAmount).toFixed(2),
        Number(r.taxAmount).toFixed(2),
        Number(r.totalAmount).toFixed(2),
        Number(r.amountPaid).toFixed(2),
        Number(r.amountDue).toFixed(2),
        r.status,
        r.cashier ? `${r.cashier.firstName} ${r.cashier.lastName}` : '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Export ready');
  }

  function clearFilters() {
    setStatusFilter('');
    setChannelFilter('');
    setDateFrom(isToday ? format(new Date(), 'yyyy-MM-dd') : '');
    setDateTo(isToday ? format(new Date(), 'yyyy-MM-dd') : '');
    setPage(1);
  }

  const hasActiveFilters = !!(
    statusFilter ||
    channelFilter ||
    dateFrom ||
    dateTo
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={isToday ? 'Today Sales' : 'All Sales'}
        description={
          isToday
            ? 'Sales processed today across the active branch. Auto-refreshes every 2 minutes.'
            : 'Complete sales history for the active branch.'
        }
        actions={
          <Button
            size="sm"
            variant="brand"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowNewSale(true)}
          >
            New Sale
          </Button>
        }
      />

      {/* KPI row */}
      {kpis && <KpiRow items={kpis} />}

      {/* Advanced filters bar */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Filters</span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v === 'all' ? '' : (v as SaleStatus));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {SALE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Channel</Label>
              <Select
                value={channelFilter}
                onValueChange={(v) => {
                  setChannelFilter(v === 'all' ? '' : (v as SaleChannel));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  {SALE_CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CHANNEL_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">From date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">To date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main list */}
      <ErpListPage
        title=""
        searchPlaceholder="Search receipt, customer, item…"
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
        emptyLabel={isToday ? 'No sales today yet' : 'No sales yet'}
        rowKey={(r) => r.id}
        extraFilters={extraFilters}
      />

      {/* Sale detail drawer */}
      <SaleDetailDialog
        saleId={detailId}
        onClose={() => setDetailId(null)}
        onVoid={(sale) => {
          setVoidTarget(sale);
          setIsRefund(false);
          setVoidReason('');
          setDetailId(null);
        }}
        onRefund={(sale) => {
          setVoidTarget(sale);
          setIsRefund(true);
          setVoidReason('');
          setDetailId(null);
        }}
      />

      {/* Void/Refund dialog */}
      {voidTarget && (
        <VoidSaleDialog
          sale={voidTarget}
          isRefund={isRefund}
          reason={voidReason}
          onReasonChange={setVoidReason}
          onClose={() => {
            setVoidTarget(null);
            setVoidReason('');
          }}
          onToggleRefund={() => setIsRefund((p) => !p)}
        />
      )}

      {/* New sale modal */}
      <NewSaleDialog open={showNewSale} onClose={() => setShowNewSale(false)} />
    </div>
  );
}

// ─── Sale Detail Dialog ───────────────────────────────────────────────────────

function SaleDetailDialog({
  saleId,
  onClose,
  onVoid,
  onRefund,
}: {
  saleId: string | null;
  onClose: () => void;
  onVoid: (sale: Sale) => void;
  onRefund: (sale: Sale) => void;
}) {
  const { data: sale, isLoading, isError } = useSale(saleId);
  const [printing, setPrinting] = React.useState(false);

  function handlePrint() {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  }

  const canReverse =
    sale &&
    sale.status !== 'VOIDED' &&
    sale.status !== 'REFUNDED' &&
    sale.status !== 'DRAFT';

  return (
    <Dialog open={!!saleId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="p-6">
            <PageSkeleton />
          </div>
        ) : isError || !sale ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Could not load sale details.
          </div>
        ) : (
          <>
            {/* Header */}
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="flex items-center gap-2 font-mono">
                    <Receipt className="h-4 w-4 text-brand-600" />
                    {sale.receiptNumber}
                  </DialogTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(sale.soldAt, 'dd MMM yyyy · HH:mm')}
                    {sale.cashier && (
                      <>
                        {' · '}Cashier: {sale.cashier.firstName}{' '}
                        {sale.cashier.lastName}
                      </>
                    )}
                  </p>
                </div>
                <StatusBadge status={sale.status} />
              </div>
            </DialogHeader>

            <div className="space-y-5 px-6 pb-2">
              {/* Customer + channel */}
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Customer
                  </p>
                  <p className="mt-1 font-medium">
                    {sale.customer?.name ?? 'Walk-in'}
                  </p>
                  {sale.customer?.phone && (
                    <p className="text-xs text-muted-foreground">
                      {sale.customer.phone}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Channel
                  </p>
                  <p className="mt-1">
                    <Badge variant="outline">
                      {CHANNEL_LABELS[sale.channel] ?? sale.channel}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Line items */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Line Items
                </p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                          Item
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                          Qty
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                          Unit Price
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                          Disc.
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale.lineItems.map((line) => (
                        <tr
                          key={line.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-3 py-2.5">
                            <span className="font-medium">{line.name}</span>
                            {line.sku && (
                              <span className="ml-2 font-mono text-xs text-muted-foreground">
                                {line.sku}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {line.quantity}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {formatKsh(line.unitPrice)}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                            {Number(line.discount) > 0
                              ? `–${formatKsh(line.discount)}`
                              : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                            {formatKsh(line.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial summary */}
              <div className="rounded-lg border border-border p-4 space-y-2.5 text-sm">
                <SummaryRow label="Subtotal" value={formatKsh(sale.subtotal)} />
                {Number(sale.discountAmount) > 0 && (
                  <SummaryRow
                    label="Discount"
                    value={`–${formatKsh(sale.discountAmount)}`}
                    valueClass="text-destructive"
                  />
                )}
                {Number(sale.taxRate) > 0 && (
                  <SummaryRow
                    label={`Tax (${Number(sale.taxRate).toFixed(1)}%)`}
                    value={formatKsh(sale.taxAmount)}
                  />
                )}
                <div className="border-t border-border pt-2.5">
                  <SummaryRow
                    label="Total"
                    value={formatKsh(sale.totalAmount)}
                    bold
                  />
                </div>
                <SummaryRow
                  label="Amount Paid"
                  value={formatKsh(sale.amountPaid)}
                  valueClass="text-success"
                />
                {Number(sale.amountDue) > 0 && (
                  <SummaryRow
                    label="Balance Due"
                    value={formatKsh(sale.amountDue)}
                    valueClass="text-warning-foreground font-semibold"
                  />
                )}
              </div>

              {/* Payments */}
              {sale.payments.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Payments
                  </p>
                  <div className="space-y-2">
                    {sale.payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                          </Badge>
                          {p.reference && (
                            <span className="font-mono text-xs text-muted-foreground">
                              {p.reference}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-semibold tabular-nums">
                            {formatKsh(p.amount)}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {formatDate(p.paidAt, 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {sale.notes && (
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Note: </span>
                  {sale.notes}
                </div>
              )}

              {/* Void notice */}
              {(sale.status === 'VOIDED' || sale.status === 'REFUNDED') &&
                sale.voidedAt && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {sale.status === 'VOIDED' ? 'Voided' : 'Refunded'} on{' '}
                      {formatDate(sale.voidedAt, 'dd MMM yyyy HH:mm')}
                    </span>
                  </div>
                )}
            </div>

            <DialogFooter className="flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Printer className="h-3.5 w-3.5" />}
                loading={printing}
                onClick={handlePrint}
              >
                Print receipt
              </Button>
              {canReverse && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-warning-foreground border-warning/40 hover:bg-warning/10"
                    leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                    onClick={() => onRefund(sale)}
                  >
                    Refund
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    leftIcon={<Ban className="h-3.5 w-3.5" />}
                    onClick={() => onVoid(sale)}
                  >
                    Void
                  </Button>
                </>
              )}
            </DialogFooter>

            {/* Print-only receipt — hidden on screen, rendered by print dialog */}
            <SaleReceipt sale={sale} printOnly />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  valueClass,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          'text-muted-foreground',
          bold && 'font-semibold text-foreground',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'tabular-nums',
          bold && 'font-bold text-base',
          valueClass,
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Void / Refund Dialog ─────────────────────────────────────────────────────

function VoidSaleDialog({
  sale,
  isRefund,
  reason,
  onReasonChange,
  onClose,
  onToggleRefund,
}: {
  sale: Sale;
  isRefund: boolean;
  reason: string;
  onReasonChange: (v: string) => void;
  onClose: () => void;
  onToggleRefund: () => void;
}) {
  const branchId = useBranchStore((s) => s.activeBranchId) ?? '';
  const voidMutation = useVoidSale(sale.id);

  async function handleConfirm() {
    if (!reason.trim()) {
      toast.error('A reason is required to reverse a sale');
      return;
    }
    try {
      await voidMutation.mutateAsync({ branchId, reason, refund: isRefund });
      toast.success(isRefund ? 'Sale refunded' : 'Sale voided');
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not reverse sale'));
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRefund ? (
              <RefreshCw className="h-4 w-4 text-warning-foreground" />
            ) : (
              <Ban className="h-4 w-4 text-destructive" />
            )}
            {isRefund ? 'Refund sale' : 'Void sale'} — {sale.receiptNumber}
          </DialogTitle>
          <DialogDescription>
            {isRefund
              ? 'Stock is returned to inventory and any credit balance is reversed. The customer is marked as refunded.'
              : 'The sale is cancelled, stock is returned and any credit balance is unwound. This cannot be undone.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6">
          {/* Toggle void ↔ refund */}
          <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
            <button
              type="button"
              onClick={onToggleRefund}
              className={cn(
                'flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors',
                !isRefund
                  ? 'bg-destructive/10 text-destructive'
                  : 'text-muted-foreground hover:bg-accent',
              )}
            >
              Void (cancelled)
            </button>
            <button
              type="button"
              onClick={onToggleRefund}
              className={cn(
                'flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors',
                isRefund
                  ? 'bg-warning/10 text-warning-foreground'
                  : 'text-muted-foreground hover:bg-accent',
              )}
            >
              Refund (money returned)
            </button>
          </div>

          {/* Financial summary */}
          <div className="rounded-md border border-border p-3 text-sm space-y-1.5">
            <SummaryRow
              label="Sale total"
              value={formatKsh(sale.totalAmount)}
            />
            <SummaryRow
              label="Amount paid"
              value={formatKsh(sale.amountPaid)}
            />
            {Number(sale.amountDue) > 0 && (
              <SummaryRow
                label="Credit to unwind"
                value={formatKsh(sale.amountDue)}
                valueClass="text-warning-foreground"
              />
            )}
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Reason <span className="text-destructive">*</span>
            </Label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Enter reason for reversal…"
              maxLength={500}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
            />
            <p className="text-right text-xs text-muted-foreground">
              {reason.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={voidMutation.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant={isRefund ? 'outline' : 'destructive'}
            loading={voidMutation.isPending}
            disabled={!reason.trim()}
            onClick={() => void handleConfirm()}
            className={
              isRefund
                ? 'border-warning/40 text-warning-foreground hover:bg-warning/10'
                : ''
            }
          >
            {isRefund ? 'Confirm refund' : 'Void sale'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── New Sale Dialog ──────────────────────────────────────────────────────────

interface LineItemDraft {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface PaymentDraft {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference: string;
}

function NewSaleDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const branchId = useBranchStore((s) => s.activeBranchId) ?? '';
  const [customerId, setCustomerId] = React.useState('');
  const [channel, setChannel] = React.useState<SaleChannel>('POS');
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [taxRate, setTaxRate] = React.useState(0);
  const [notes, setNotes] = React.useState('');
  const [lines, setLines] = React.useState<LineItemDraft[]>([]);
  const [payments, setPayments] = React.useState<PaymentDraft[]>([]);
  const [itemSearch, setItemSearch] = React.useState('');

  const createSale = useCreateSale();
  const { data: customersData } = useErpCustomers({ limit: 100 });
  const customers = customersData?.data ?? [];
  const { data: itemsData } = useInventoryItems({
    search: itemSearch,
    limit: 20,
  });
  const inventoryItems = itemsData?.data ?? [];

  // ── Derived totals ──
  const subtotal = lines.reduce(
    (sum, l) => sum + l.quantity * l.unitPrice - l.discount,
    0,
  );
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxable * taxRate) / 100;
  const total = taxable + taxAmount;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const amountDue = Math.max(0, total - totalPaid);

  function addLine(item: {
    id: string;
    name: string;
    unitPrice: number | string;
    sku?: string | null;
  }) {
    setLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        itemId: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: Number(item.unitPrice),
        discount: 0,
      },
    ]);
    setItemSearch('');
  }

  function updateLine(id: string, patch: Partial<LineItemDraft>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  function addPayment() {
    setPayments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        method: 'CASH',
        amount: Math.max(0, amountDue),
        reference: '',
      },
    ]);
  }

  function updatePayment(id: string, patch: Partial<PaymentDraft>) {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  }

  function removePayment(id: string) {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    if (amountDue > 0 && !customerId) {
      toast.error('A credit sale requires a customer');
      return;
    }
    try {
      await createSale.mutateAsync({
        branchId,
        customerId: customerId || undefined,
        channel,
        discountAmount: discountAmount || undefined,
        taxRate: taxRate || undefined,
        notes: notes || undefined,
        items: lines.map((l): CreateSaleLineItem => ({
          itemId: l.itemId || undefined,
          name: l.name,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount || undefined,
        })),
        payments: payments.map((p): CreateSalePayment => ({
          method: p.method,
          amount: p.amount,
          reference: p.reference || undefined,
        })),
      });
      toast.success('Sale recorded');
      onClose();
      // Reset
      setLines([]);
      setPayments([]);
      setCustomerId('');
      setDiscountAmount(0);
      setTaxRate(0);
      setNotes('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not record sale'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-brand-600" />
            New Sale
          </DialogTitle>
          <DialogDescription>
            Record a POS or credit sale. Select items, apply payments and save.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-5 px-6 pb-2"
        >
          {/* Customer + channel */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Customer
                <span className="text-xs text-muted-foreground font-normal">
                  (required for credit)
                </span>
              </Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Walk-in / no account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Walk-in / no account</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.phone ? ` · ${c.phone}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Channel
              </Label>
              <Select
                value={channel}
                onValueChange={(v) => setChannel(v as SaleChannel)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SALE_CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CHANNEL_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Item search */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" /> Add Items
            </Label>
            <div className="relative">
              <Input
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Search inventory items…"
                className="h-9 text-sm"
                leftIcon={<Filter className="h-3.5 w-3.5" />}
              />
              {itemSearch && inventoryItems.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-high">
                  {inventoryItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        addLine({
                          id: item.id,
                          name: item.name,
                          unitPrice: item.unitPrice ?? 0,
                          sku: item.sku,
                        })
                      }
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-accent"
                    >
                      <div>
                        <span className="font-medium">{item.name}</span>
                        {item.sku && (
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            {item.sku}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-semibold tabular-nums">
                          {formatKsh(item.unitPrice ?? 0)}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {item.quantity ?? 0} in stock
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Line items table */}
          {lines.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Item
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground w-20">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground w-28">
                      Unit Price
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground w-24">
                      Discount
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground w-28">
                      Total
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const lineTotal =
                      line.quantity * line.unitPrice - line.discount;
                    return (
                      <tr
                        key={line.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-3 py-2">
                          <span className="font-medium">{line.name}</span>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(e) =>
                              updateLine(line.id, {
                                quantity: Math.max(1, Number(e.target.value)),
                              })
                            }
                            className="h-7 w-16 text-right text-xs ml-auto"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={line.unitPrice}
                            onChange={(e) =>
                              updateLine(line.id, {
                                unitPrice: Number(e.target.value),
                              })
                            }
                            className="h-7 w-24 text-right text-xs ml-auto"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={line.discount}
                            onChange={(e) =>
                              updateLine(line.id, {
                                discount: Number(e.target.value),
                              })
                            }
                            className="h-7 w-20 text-right text-xs ml-auto"
                          />
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">
                          {formatKsh(lineTotal)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Whole-sale adjustments */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Sale Discount (KSh)
              </Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={discountAmount || ''}
                placeholder="0"
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5" /> Tax Rate (%)
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={taxRate || ''}
                placeholder="0"
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Financial summary */}
          {lines.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2 text-sm">
              <SummaryRow label="Subtotal" value={formatKsh(subtotal)} />
              {discountAmount > 0 && (
                <SummaryRow
                  label="Discount"
                  value={`–${formatKsh(discountAmount)}`}
                  valueClass="text-destructive"
                />
              )}
              {taxRate > 0 && (
                <SummaryRow
                  label={`Tax (${taxRate}%)`}
                  value={formatKsh(taxAmount)}
                />
              )}
              <div className="border-t border-border pt-2">
                <SummaryRow label="Total" value={formatKsh(total)} bold />
              </div>
              <SummaryRow
                label="Total Paid"
                value={formatKsh(totalPaid)}
                valueClass="text-success"
              />
              {amountDue > 0 && (
                <SummaryRow
                  label="Balance Due"
                  value={formatKsh(amountDue)}
                  valueClass="text-warning-foreground font-semibold"
                />
              )}
            </div>
          )}

          {/* Payments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" /> Payments
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addPayment}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                Add payment
              </Button>
            </div>
            {payments.map((p) => (
              <div
                key={p.id}
                className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <Select
                  value={p.method}
                  onValueChange={(v) =>
                    updatePayment(p.id, { method: v as PaymentMethod })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={p.amount || ''}
                  placeholder="Amount"
                  onChange={(e) =>
                    updatePayment(p.id, { amount: Number(e.target.value) })
                  }
                  className="h-8 text-xs"
                />
                <Input
                  value={p.reference}
                  placeholder="Reference (optional)"
                  onChange={(e) =>
                    updatePayment(p.id, { reference: e.target.value })
                  }
                  className="h-8 text-xs"
                />
                <button
                  type="button"
                  onClick={() => removePayment(p.id)}
                  className="text-muted-foreground hover:text-destructive self-center"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {payments.length === 0 && lines.length > 0 && (
              <p className="text-xs text-muted-foreground">
                No payments added — sale will be recorded as a credit sale
                (requires customer).
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm">Notes (optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes for this sale…"
              maxLength={1000}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
            />
          </div>
        </form>

        <DialogFooter className="flex-wrap gap-2 px-6 pb-6">
          {amountDue > 0 && !customerId && (
            <p className="flex-1 text-xs text-warning-foreground flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Select a customer for credit sales
            </p>
          )}
          <Button
            variant="outline"
            disabled={createSale.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="brand"
            loading={createSale.isPending}
            disabled={lines.length === 0 || (amountDue > 0 && !customerId)}
            onClick={(e) => void handleSubmit(e)}
          >
            Record sale · {formatKsh(total)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
