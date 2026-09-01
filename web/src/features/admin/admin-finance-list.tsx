'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Receipt,
  Wallet,
  TrendingUp,
  AlertCircle,
  FileText,
  Download,
  Plus,
  Eye,
  Send,
  CreditCard,
  X,
  Printer,
  Filter,
  CheckCircle2,
  Clock,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatRelativeDate } from '@/lib/utils';
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
import { PageHeader, EmptyState, ErrorState } from '@/components/ui/page-header';
import { PageSkeleton } from '@/components/ui/skeleton';
import {
  KpiRow,
  FilterChips,
  ListSearchBar,
  Pagination,
  formatKsh,
} from '@/components/admin/erp-list-shell';
import { ErpListPage, type ErpColumn } from './erp/erp-list-page';
import {
  useFinanceSummary,
  useInvoices,
  useInvoice,
  useCreateInvoice,
  useIssueInvoice,
  useRecordPayment,
  INVOICE_STATUSES,
  INVOICE_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  CURRENCIES,
  type Invoice,
  type InvoiceStatus,
  type Currency,
  type PaymentMethod,
  type InvoiceLineItemPayload,
} from '@/lib/api/hooks/use-finance';
import { useClients } from '@/lib/api/hooks/use-clients';
import { useAuthStore } from '@/stores/auth-store';
import { getApiErrorMessage } from '@/lib/api/api-error';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'invoices' | 'payments';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format any currency amount with its ISO code */
function formatAmount(value: string | number | null | undefined, currency: Currency): string {
  const n = typeof value === 'string' ? Number(value) : (value ?? 0);
  if (!Number.isFinite(n)) return '—';
  if (currency === 'KES') return formatKsh(n);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

function isOverdue(invoice: Invoice): boolean {
  return (
    invoice.status !== 'PAID' &&
    invoice.status !== 'CANCELLED' &&
    !!invoice.dueDate &&
    new Date(invoice.dueDate) < new Date()
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminFinanceList({ initialTab = 'invoices' }: { initialTab?: Tab }) {
  const [tab, setTab] = React.useState<Tab>(initialTab);

  // Invoices list state
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [statusFilter, setStatusFilter] = React.useState<InvoiceStatus | ''>('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');

  // Payments ledger state
  const [paySearch, setPaySearch] = React.useState('');
  const [payPage, setPayPage] = React.useState(1);
  const [payPerPage, setPayPerPage] = React.useState(15);
  const [payStatusFilter, setPayStatusFilter] = React.useState<InvoiceStatus | ''>('');

  // Dialogs
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [payInvoice, setPayInvoice] = React.useState<Invoice | null>(null);
  const [issueTarget, setIssueTarget] = React.useState<Invoice | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);

  // Data
  const { data: summary, isLoading: summaryLoading } = useFinanceSummary();
  const invoicesQuery = useInvoices({
    page,
    limit: perPage,
    search: search || undefined,
    status: statusFilter || undefined,
  });
  // Payments view reuses the invoices endpoint filtered to only paid/partial
  const paymentsQuery = useInvoices({
    page: payPage,
    limit: payPerPage,
    search: paySearch || undefined,
    status: payStatusFilter || (undefined as InvoiceStatus | undefined),
  });

  const issueInvoice = useIssueInvoice();

  // ── KPIs ──
  const kpis = [
    {
      label: 'Total Invoiced',
      value: summaryLoading ? '…' : formatKsh(summary?.totalInvoiced ?? 0),
      sub: `${summary?.draftCount ?? 0} drafts pending`,
      icon: <FileText className="h-4 w-4" />,
      accent: 'brand' as const,
    },
    {
      label: 'Total Collected',
      value: formatKsh(summary?.totalPaid ?? 0),
      sub: 'Confirmed payments',
      icon: <CheckCircle2 className="h-4 w-4" />,
      accent: 'success' as const,
    },
    {
      label: 'Outstanding',
      value: formatKsh(summary?.totalOutstanding ?? 0),
      sub: 'Billed but unpaid',
      icon: <Clock className="h-4 w-4" />,
      accent: 'warning' as const,
    },
    {
      label: 'Overdue',
      value: summary?.overdueCount ?? 0,
      sub: 'Past due date',
      icon: <AlertCircle className="h-4 w-4" />,
      accent: 'destructive' as const,
    },
  ];

  // ── Invoice columns ──
  const invoiceColumns: ErpColumn<Invoice>[] = [
    {
      key: 'number',
      header: 'Invoice #',
      cell: (r) => (
        <button
          type="button"
          onClick={() => setDetailId(r.id)}
          className="group flex items-center gap-1.5 text-left"
        >
          <span className="font-mono text-xs font-semibold text-brand-600 underline-offset-2 group-hover:underline dark:text-brand-400">
            {r.invoiceNumber}
          </span>
        </button>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      cell: (r) =>
        r.client ? (
          <span className="font-medium text-sm">{r.client.companyName}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => {
        const overdue = isOverdue(r);
        return overdue && r.status !== 'OVERDUE' ? (
          <StatusBadge status="OVERDUE" />
        ) : (
          <StatusBadge status={r.status} />
        );
      },
    },
    {
      key: 'currency',
      header: 'CCY',
      cell: (r) => (
        <Badge variant="outline" className="text-xs font-mono">
          {r.currency}
        </Badge>
      ),
    },
    {
      key: 'total',
      header: <span className="block text-right">Total</span>,
      cell: (r) => (
        <span className="block text-right tabular-nums font-semibold text-sm">
          {formatAmount(r.totalAmount, r.currency)}
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
            Number(r.amountDue) <= 0 ? 'text-success' : 'text-muted-foreground',
          )}
        >
          {formatAmount(r.amountPaid, r.currency)}
        </span>
      ),
    },
    {
      key: 'due',
      header: <span className="block text-right">Balance</span>,
      cell: (r) => (
        <span
          className={cn(
            'block text-right tabular-nums text-sm font-medium',
            Number(r.amountDue) > 0 ? 'text-warning-foreground' : 'text-muted-foreground',
          )}
        >
          {Number(r.amountDue) > 0 ? formatAmount(r.amountDue, r.currency) : '—'}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      cell: (r) =>
        r.dueDate ? (
          <span
            className={cn(
              'text-xs',
              isOverdue(r) ? 'font-semibold text-destructive' : 'text-muted-foreground',
            )}
            title={formatDate(r.dueDate, 'dd MMM yyyy')}
          >
            {formatDate(r.dueDate, 'dd MMM yyyy')}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'created',
      header: 'Created',
      cell: (r) => (
        <span className="text-xs text-muted-foreground" title={formatDate(r.createdAt)}>
          {formatRelativeDate(r.createdAt)}
        </span>
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
            title="View invoice"
            onClick={() => setDetailId(r.id)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {r.status === 'DRAFT' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:text-brand-600"
              title="Issue invoice"
              onClick={() => setIssueTarget(r)}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
          {(r.status === 'ISSUED' || r.status === 'PARTIALLY_PAID' || r.status === 'OVERDUE') && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:text-success"
              title="Record payment"
              onClick={() => setPayInvoice(r)}
            >
              <CreditCard className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Export ──
  function handleExport() {
    const rows = (invoicesQuery.data?.data as Invoice[] | undefined) ?? [];
    if (rows.length === 0) { toast.error('No data to export'); return; }
    const headers = ['Invoice #', 'Client', 'Status', 'Currency', 'Subtotal', 'Tax', 'Total', 'Paid', 'Balance', 'Due Date', 'Issued At', 'Created'];
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.invoiceNumber,
          r.client?.companyName ?? '',
          r.status,
          r.currency,
          Number(r.subtotal).toFixed(2),
          Number(r.taxAmount).toFixed(2),
          Number(r.totalAmount).toFixed(2),
          Number(r.amountPaid).toFixed(2),
          Number(r.amountDue).toFixed(2),
          r.dueDate ? formatDate(r.dueDate, 'dd/MM/yyyy') : '',
          r.issuedAt ? formatDate(r.issuedAt, 'dd/MM/yyyy') : '',
          formatDate(r.createdAt, 'dd/MM/yyyy'),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `invoices-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Export ready');
  }

  function handleExportPayments() {
    const rows = (paymentsQuery.data?.data as Invoice[] | undefined) ?? [];
    if (rows.length === 0) { toast.error('No data to export'); return; }
    const headers = ['Invoice #', 'Client', 'Currency', 'Total', 'Paid', 'Balance', 'Status', 'Paid At'];
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.invoiceNumber,
          r.client?.companyName ?? '',
          r.currency,
          Number(r.totalAmount).toFixed(2),
          Number(r.amountPaid).toFixed(2),
          Number(r.amountDue).toFixed(2),
          r.status,
          r.paidAt ? formatDate(r.paidAt, 'dd/MM/yyyy') : '',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `payments-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Export ready');
  }

  // ── Payments ledger columns (re-uses Invoice rows) ──
  const paymentColumns: ErpColumn<Invoice>[] = [
    {
      key: 'number',
      header: 'Invoice #',
      cell: (r) => (
        <button type="button" onClick={() => setDetailId(r.id)}
          className="font-mono text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
          {r.invoiceNumber}
        </button>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      cell: (r) => <span className="font-medium text-sm">{r.client?.companyName ?? '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'currency',
      header: 'CCY',
      cell: (r) => <Badge variant="outline" className="font-mono text-xs">{r.currency}</Badge>,
    },
    {
      key: 'total',
      header: <span className="block text-right">Invoice Total</span>,
      cell: (r) => (
        <span className="block text-right tabular-nums text-sm font-semibold">
          {formatAmount(r.totalAmount, r.currency)}
        </span>
      ),
    },
    {
      key: 'paid',
      header: <span className="block text-right">Collected</span>,
      cell: (r) => (
        <span className="block text-right tabular-nums text-sm text-success">
          {formatAmount(r.amountPaid, r.currency)}
        </span>
      ),
    },
    {
      key: 'balance',
      header: <span className="block text-right">Balance</span>,
      cell: (r) => (
        <span className={cn(
          'block text-right tabular-nums text-sm',
          Number(r.amountDue) > 0 ? 'font-medium text-warning-foreground' : 'text-muted-foreground',
        )}>
          {Number(r.amountDue) > 0 ? formatAmount(r.amountDue, r.currency) : 'Cleared'}
        </span>
      ),
    },
    {
      key: 'paidAt',
      header: 'Paid / Due',
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.paidAt
            ? formatDate(r.paidAt, 'dd MMM yyyy')
            : r.dueDate
              ? `Due ${formatDate(r.dueDate, 'dd MMM yyyy')}`
              : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDetailId(r.id)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {(r.status === 'ISSUED' || r.status === 'PARTIALLY_PAID' || r.status === 'OVERDUE') && (
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-success"
              title="Record payment" onClick={() => setPayInvoice(r)}>
              <CreditCard className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const invoiceExtraFilters = (
    <div className="flex items-center gap-2">
      <Button size="sm" variant={showFilters ? 'brand' : 'outline'}
        onClick={() => setShowFilters((p) => !p)}
        leftIcon={<Filter className="h-3.5 w-3.5" />}
      >
        Filters
        {(statusFilter || dateFrom || dateTo) && (
          <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white">
            {[statusFilter, dateFrom || dateTo].filter(Boolean).length}
          </span>
        )}
      </Button>
      <Button size="sm" variant="outline"
        leftIcon={<Download className="h-3.5 w-3.5" />} onClick={handleExport}>
        Export
      </Button>
    </div>
  );

  const paymentExtraFilters = (
    <Button size="sm" variant="outline"
      leftIcon={<Download className="h-3.5 w-3.5" />} onClick={handleExportPayments}>
      Export
    </Button>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <PageHeader
        title="Finance"
        description="Organization-scoped invoices, payments and financial position."
        actions={
          <Button size="sm" variant="brand"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreate(true)}
          >
            New Invoice
          </Button>
        }
      />

      {/* KPIs */}
      <KpiRow items={kpis} />

      {/* Tab switcher */}
      <div className="flex gap-0 border-b border-border">
        {(['invoices', 'payments'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition-colors -mb-px',
              tab === t
                ? 'border-brand-500 text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'invoices' ? (
              <Receipt className="h-3.5 w-3.5" />
            ) : (
              <Wallet className="h-3.5 w-3.5" />
            )}
            {t}
          </button>
        ))}
      </div>

      {/* ── Invoices tab ── */}
      {tab === 'invoices' && (
        <>
          {showFilters && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Filters</span>
                {(statusFilter || dateFrom || dateTo) && (
                  <button type="button"
                    onClick={() => { setStatusFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" /> Clear all
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={statusFilter}
                    onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v as InvoiceStatus); setPage(1); }}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {INVOICE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{INVOICE_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">From date</Label>
                  <Input type="date" value={dateFrom} className="h-9 text-sm"
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To date</Label>
                  <Input type="date" value={dateTo} className="h-9 text-sm"
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
                </div>
              </div>
            </div>
          )}

          <ErpListPage
            title=""
            searchPlaceholder="Search invoice #, client…"
            filterChips={[
              { key: 'all', label: 'All' },
              { key: 'DRAFT', label: 'Draft' },
              { key: 'ISSUED', label: 'Issued' },
              { key: 'PARTIALLY_PAID', label: 'Partial' },
              { key: 'OVERDUE', label: 'Overdue' },
              { key: 'PAID', label: 'Paid' },
            ]}
            filterValue={statusFilter || 'all'}
            onFilterChange={(k) => {
              setStatusFilter(k === 'all' ? '' : k as InvoiceStatus);
              setPage(1);
            }}
            columns={invoiceColumns}
            query={invoicesQuery as never}
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
            emptyLabel="No invoices yet"
            rowKey={(r) => r.id}
            extraFilters={invoiceExtraFilters}
          />
        </>
      )}

      {/* ── Payments tab ── */}
      {tab === 'payments' && (
        <ErpListPage
          title=""
          searchPlaceholder="Search invoice #, client…"
          filterChips={[
            { key: 'all', label: 'All' },
            { key: 'ISSUED', label: 'Awaiting Payment' },
            { key: 'PARTIALLY_PAID', label: 'Partial' },
            { key: 'OVERDUE', label: 'Overdue' },
            { key: 'PAID', label: 'Paid' },
          ]}
          filterValue={payStatusFilter || 'all'}
          onFilterChange={(k) => {
            setPayStatusFilter(k === 'all' ? '' : k as InvoiceStatus);
            setPayPage(1);
          }}
          columns={paymentColumns}
          query={paymentsQuery as never}
          search={paySearch}
          onSearchChange={(v) => { setPaySearch(v); setPayPage(1); }}
          page={payPage}
          perPage={payPerPage}
          onPageChange={setPayPage}
          onPerPageChange={(n) => { setPayPerPage(n); setPayPage(1); }}
          emptyLabel="No payment records yet"
          rowKey={(r) => r.id}
          extraFilters={paymentExtraFilters}
        />
      )}

      {/* ── Dialogs ── */}
      <InvoiceDetailDialog
        invoiceId={detailId}
        onClose={() => setDetailId(null)}
        onIssue={(inv) => { setIssueTarget(inv); setDetailId(null); }}
        onPay={(inv) => { setPayInvoice(inv); setDetailId(null); }}
      />

      {issueTarget && (
        <IssueInvoiceDialog
          invoice={issueTarget}
          onClose={() => setIssueTarget(null)}
        />
      )}

      {payInvoice && (
        <RecordPaymentDialog
          invoice={payInvoice}
          onClose={() => setPayInvoice(null)}
        />
      )}

      {showCreate && (
        <CreateInvoiceDialog
          open={showCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

// ─── Invoice Detail Dialog ────────────────────────────────────────────────────

function InvoiceDetailDialog({
  invoiceId,
  onClose,
  onIssue,
  onPay,
}: {
  invoiceId: string | null;
  onClose: () => void;
  onIssue: (inv: Invoice) => void;
  onPay: (inv: Invoice) => void;
}) {
  const { data: invoice, isLoading, isError } = useInvoice(invoiceId);

  function handlePrint() {
    window.print();
  }

  const canIssue = invoice?.status === 'DRAFT';
  const canPay = invoice?.status === 'ISSUED' || invoice?.status === 'PARTIALLY_PAID' || invoice?.status === 'OVERDUE';

  return (
    <Dialog open={!!invoiceId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="p-6"><PageSkeleton /></div>
        ) : isError || !invoice ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Could not load invoice.</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="flex items-center gap-2 font-mono">
                    <Receipt className="h-4 w-4 text-brand-600" />
                    {invoice.invoiceNumber}
                  </DialogTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Created {formatDate(invoice.createdAt, 'dd MMM yyyy')}
                    {invoice.issuedAt && ` · Issued ${formatDate(invoice.issuedAt, 'dd MMM yyyy')}`}
                    {invoice.paidAt && ` · Paid ${formatDate(invoice.paidAt, 'dd MMM yyyy')}`}
                  </p>
                </div>
                <StatusBadge status={isOverdue(invoice) && invoice.status !== 'OVERDUE' ? 'OVERDUE' : invoice.status} />
              </div>
            </DialogHeader>

            <div className="space-y-5 px-6 pb-2">
              {/* Client + currency */}
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</p>
                  <p className="mt-1 font-medium">{invoice.client?.companyName ?? '—'}</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Currency</p>
                    <Badge variant="outline" className="mt-1 font-mono text-xs">{invoice.currency}</Badge>
                  </div>
                  {invoice.dueDate && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</p>
                      <p className={cn('mt-1 text-sm', isOverdue(invoice) ? 'font-semibold text-destructive' : '')}>
                        {formatDate(invoice.dueDate, 'dd MMM yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Line items */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Line Items</p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Description</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground w-20">Qty</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground w-32">Unit Price</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground w-32">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lineItems.map((line) => (
                        <tr key={line.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2.5 font-medium">{line.description}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{Number(line.quantity)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{formatAmount(line.unitPrice, invoice.currency)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{formatAmount(line.lineTotal, invoice.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial summary */}
              <div className="rounded-lg border border-border p-4 space-y-2.5 text-sm">
                <FinRow label="Subtotal" value={formatAmount(invoice.subtotal, invoice.currency)} />
                {Number(invoice.taxRate) > 0 && (
                  <FinRow label={`Tax (${Number(invoice.taxRate).toFixed(1)}%)`} value={formatAmount(invoice.taxAmount, invoice.currency)} />
                )}
                <div className="border-t border-border pt-2.5">
                  <FinRow label="Invoice Total" value={formatAmount(invoice.totalAmount, invoice.currency)} bold />
                </div>
                <FinRow label="Amount Paid" value={formatAmount(invoice.amountPaid, invoice.currency)} valueClass="text-success" />
                {Number(invoice.amountDue) > 0 && (
                  <FinRow label="Balance Due" value={formatAmount(invoice.amountDue, invoice.currency)} valueClass="text-warning-foreground font-semibold" />
                )}
              </div>

              {/* Payment history */}
              {invoice.payments.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment History</p>
                  <div className="space-y-2">
                    {invoice.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</Badge>
                          {p.transactionRef && (
                            <span className="font-mono text-xs text-muted-foreground">{p.transactionRef}</span>
                          )}
                          {p.bankName && (
                            <span className="text-xs text-muted-foreground">{p.bankName}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-semibold tabular-nums">{formatAmount(p.amount, p.currency)}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{formatDate(p.paymentDate, 'dd MMM yyyy')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {invoice.notes && (
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Note: </span>{invoice.notes}
                </div>
              )}

              {/* Overdue warning */}
              {isOverdue(invoice) && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    This invoice is <strong>overdue</strong>. Due date was {formatDate(invoice.dueDate!, 'dd MMM yyyy')}.
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="flex-wrap gap-2">
              <Button variant="outline" size="sm" leftIcon={<Printer className="h-3.5 w-3.5" />} onClick={handlePrint}>
                Print
              </Button>
              {canIssue && (
                <Button variant="brand" size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}
                  onClick={() => onIssue(invoice as unknown as Invoice)}>
                  Issue to client
                </Button>
              )}
              {canPay && (
                <Button variant="brand" size="sm" leftIcon={<CreditCard className="h-3.5 w-3.5" />}
                  onClick={() => onPay(invoice as unknown as Invoice)}>
                  Record payment
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FinRow({
  label, value, bold, valueClass,
}: { label: string; value: string; bold?: boolean; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-muted-foreground', bold && 'font-semibold text-foreground')}>{label}</span>
      <span className={cn('tabular-nums', bold && 'font-bold text-base', valueClass)}>{value}</span>
    </div>
  );
}

// ─── Issue Invoice Dialog ─────────────────────────────────────────────────────

function IssueInvoiceDialog({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const issueMutation = useIssueInvoice();

  async function handleConfirm() {
    try {
      await issueMutation.mutateAsync(invoice.id);
      toast.success(`Invoice ${invoice.invoiceNumber} issued`);
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not issue invoice'));
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-brand-600" />
            Issue invoice — {invoice.invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            The invoice status will change from <strong>Draft</strong> to <strong>Issued</strong>. This records when the invoice was sent to the client.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-3 text-sm">
          <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2">
            <FinRow label="Client" value={invoice.client?.companyName ?? '—'} />
            <FinRow label="Invoice total" value={formatAmount(invoice.totalAmount, invoice.currency)} bold />
            {invoice.dueDate && (
              <FinRow label="Due date" value={formatDate(invoice.dueDate, 'dd MMM yyyy')} />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={issueMutation.isPending} onClick={onClose}>Cancel</Button>
          <Button variant="brand" loading={issueMutation.isPending} onClick={() => void handleConfirm()}>
            Confirm &amp; Issue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Record Payment Dialog ────────────────────────────────────────────────────

function RecordPaymentDialog({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const [amount, setAmount] = React.useState(Number(invoice.amountDue));
  const [currency, setCurrency] = React.useState<Currency>(invoice.currency);
  const [method, setMethod] = React.useState<PaymentMethod>('BANK_TRANSFER');
  const [transactionRef, setTransactionRef] = React.useState('');
  const [bankName, setBankName] = React.useState('');
  const [paymentDate, setPaymentDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = React.useState('');
  const recordPayment = useRecordPayment();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0) { toast.error('Amount must be greater than zero'); return; }
    try {
      await recordPayment.mutateAsync({
        invoiceId: invoice.id,
        data: {
          amount,
          currency,
          method,
          transactionRef: transactionRef || undefined,
          bankName: bankName || undefined,
          paymentDate,
          notes: notes || undefined,
        },
      });
      toast.success('Payment recorded');
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not record payment'));
    }
  }

  const balanceDue = Number(invoice.amountDue);
  const afterPayment = Math.max(0, balanceDue - amount);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-success" />
            Record payment — {invoice.invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            Record a payment received against this invoice. Balance due: <strong>{formatAmount(invoice.amountDue, invoice.currency)}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 pb-2">
          {/* Amount + currency */}
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <Label className="text-sm">Amount <span className="text-destructive">*</span></Label>
              <Input type="number" min={0.01} step={0.01} value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0.00" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger className="h-9 w-24 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Method */}
          <div className="space-y-1.5">
            <Label className="text-sm">Payment method <span className="text-destructive">*</span></Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-sm">Payment date <span className="text-destructive">*</span></Label>
            <Input type="date" value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)} className="h-9 text-sm" />
          </div>

          {/* Reference + bank */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Transaction ref</Label>
              <Input value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="M-Pesa code, chq no…" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Bank name</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)}
                placeholder="KCB, Equity…" className="h-9 text-sm" />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm">Notes</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…" rows={2} maxLength={500}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none" />
          </div>

          {/* Running balance */}
          {amount > 0 && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2 text-sm">
              <FinRow label="Balance due" value={formatAmount(balanceDue, invoice.currency)} />
              <FinRow label="This payment" value={formatAmount(amount, currency)} valueClass="text-success" />
              <div className="border-t border-border pt-2">
                <FinRow label="Remaining after" value={formatAmount(afterPayment, invoice.currency)}
                  bold valueClass={afterPayment <= 0 ? 'text-success' : 'text-warning-foreground'} />
              </div>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={recordPayment.isPending} onClick={onClose}>Cancel</Button>
          <Button variant="brand" loading={recordPayment.isPending}
            disabled={amount <= 0}
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}>
            Record payment · {formatAmount(amount, currency)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Invoice Dialog ────────────────────────────────────────────────────

interface LineItemDraft {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

function CreateInvoiceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const orgId = useAuthStore((s) => s.user?.organizationId) ?? '';
  const [clientId, setClientId] = React.useState('');
  const [currency, setCurrency] = React.useState<Currency>('USD');
  const [taxRate, setTaxRate] = React.useState(16);
  const [dueDate, setDueDate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [lines, setLines] = React.useState<LineItemDraft[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 },
  ]);
  const createInvoice = useCreateInvoice();
  const { data: clientsData } = useClients(orgId, { limit: 100 });
  const clients = (clientsData?.data as { id: string; companyName: string }[] | undefined) ?? [];

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  function addLine() {
    setLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 },
    ]);
  }

  function updateLine(id: string, patch: Partial<LineItemDraft>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeLine(id: string) {
    if (lines.length === 1) return; // always at least one line
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validLines = lines.filter((l) => l.description.trim() && l.unitPrice > 0);
    if (validLines.length === 0) { toast.error('Add at least one line item with a description and price'); return; }
    try {
      const invoice = await createInvoice.mutateAsync({
        clientId: clientId || undefined,
        currency,
        taxRate,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
        lineItems: validLines.map((l): InvoiceLineItemPayload => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      toast.success(`Invoice created — ${(invoice as Invoice).invoiceNumber ?? ''}`);
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not create invoice'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-brand-600" />
            New Invoice
          </DialogTitle>
          <DialogDescription>
            Create a draft invoice. You can review it before issuing to the client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 px-6 pb-2">
          {/* Client + currency */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="No client (internal)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No client (internal)</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Currency <span className="text-destructive">*</span></Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tax + due date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Tax rate (%)</Label>
              <Input type="number" min={0} max={100} step={0.01} value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Due date</Label>
              <Input type="date" value={dueDate}
                onChange={(e) => setDueDate(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Line items <span className="text-destructive">*</span></Label>
              <Button type="button" size="sm" variant="outline"
                leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={addLine}>
                Add line
              </Button>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Description</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground w-20">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground w-32">Unit Price</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground w-28">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const lineTotal = line.quantity * line.unitPrice;
                    return (
                      <tr key={line.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">
                          <Input value={line.description}
                            onChange={(e) => updateLine(line.id, { description: e.target.value })}
                            placeholder="Service description…" className="h-7 text-xs border-0 bg-transparent p-0 shadow-none focus:ring-0" />
                        </td>
                        <td className="px-3 py-2">
                          <Input type="number" min={0.0001} step={0.01} value={line.quantity}
                            onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) })}
                            className="h-7 w-16 text-right text-xs ml-auto" />
                        </td>
                        <td className="px-3 py-2">
                          <Input type="number" min={0} step={0.01} value={line.unitPrice || ''}
                            onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) })}
                            placeholder="0.00" className="h-7 w-24 text-right text-xs ml-auto" />
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-xs">
                          {formatAmount(lineTotal, currency)}
                        </td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => removeLine(line.id)}
                            disabled={lines.length === 1}
                            className="text-muted-foreground hover:text-destructive disabled:opacity-30">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2 text-sm">
            <FinRow label="Subtotal" value={formatAmount(subtotal, currency)} />
            {taxRate > 0 && (
              <FinRow label={`Tax (${taxRate}%)`} value={formatAmount(taxAmount, currency)} />
            )}
            <div className="border-t border-border pt-2">
              <FinRow label="Invoice Total" value={formatAmount(total, currency)} bold />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm">Notes (optional)</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, bank details, or internal notes…"
              rows={2} maxLength={1000}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none" />
          </div>
        </form>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" disabled={createInvoice.isPending} onClick={onClose}>Cancel</Button>
          <Button variant="brand" loading={createInvoice.isPending}
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}>
            Create draft · {formatAmount(total, currency)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
