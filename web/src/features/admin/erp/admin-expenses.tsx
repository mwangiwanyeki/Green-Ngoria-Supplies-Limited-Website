'use client';

import * as React from 'react';
import { Plus, Wallet, Receipt, Trash2, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { formatKsh } from '@/components/admin/erp-list-shell';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import { useBranchStore } from '@/stores/branch-store';
import { getApiErrorMessage } from '@/lib/api/api-error';
import {
  useExpenses, useExpenseStats, useExpenseCategories,
  useCreateExpense, useDeleteExpense,
  EXPENSE_PAYMENT_METHODS, EXPENSE_PAYMENT_METHOD_LABELS,
  type Expense, type ExpensePaymentMethod, type CreateExpensePayload,
} from '@/lib/api/hooks/use-expenses';
import { useAccounts, type Account } from '@/lib/api/hooks/use-accounts';

export function AdminExpenses() {
  const branchId = useBranchStore((s) => s.activeBranchId) ?? '';
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  const [showAdd, setShowAdd] = React.useState(false);
  const [viewExpense, setViewExpense] = React.useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Expense | null>(null);

  const query = useExpenses({ search, page, limit: perPage });
  const { data: stats } = useExpenseStats();
  const deleteMutation = useDeleteExpense();

  function handleExport() {
    const rows = query.data?.data ?? [];
    if (!rows.length) { toast.error('No data to export'); return; }
    const headers = ['Reference', 'Date', 'Category', 'Description', 'Method', 'Amount'];
    const csv = [headers.join(','),
      ...rows.map((r) => [
        r.reference ?? r.id.slice(0, 8),
        formatDate(r.incurredAt, 'dd/MM/yyyy'),
        r.category?.name ?? r.categoryName ?? '',
        r.description ?? '',
        r.method ?? '',
        Number(r.amount).toFixed(2),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `expenses-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Export ready');
  }

  const columns: ErpColumn<Expense>[] = [
    {
      key: 'reference',
      header: 'Ref',
      cell: (r) => (
        <button type="button" onClick={() => setViewExpense(r)}
          className="font-mono text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
          {r.reference ?? r.id.slice(0, 8)}
        </button>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (r) =>
        (r.category?.name ?? r.categoryName) ? (
          <Badge variant="outline">{r.category?.name ?? r.categoryName}</Badge>
        ) : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'description',
      header: 'Description',
      cell: (r) => (
        <span className="text-sm line-clamp-1">{r.description ?? '—'}</span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {EXPENSE_PAYMENT_METHOD_LABELS[r.method as ExpensePaymentMethod] ?? r.method ?? '—'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: <span className="block text-right">Amount</span>,
      cell: (r) => (
        <span className="block text-right tabular-nums font-semibold text-sm text-destructive">
          {formatKsh(r.amount)}
        </span>
      ),
    },
    {
      key: 'when',
      header: 'When',
      cell: (r) => (
        <span className="text-xs text-muted-foreground" title={formatDate(r.incurredAt)}>
          {formatRelativeDate(r.incurredAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setViewExpense(r)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-destructive"
            onClick={() => setDeleteTarget(r)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <ErpListPage
        title="Expenses"
        description="Expenses recorded for the active branch."
        actions={
          <>
            <Button size="sm" variant="outline"
              leftIcon={<Download className="h-4 w-4" />} onClick={handleExport}>
              Export
            </Button>
            <Button size="sm" variant="brand"
              leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>
              Add Expense
            </Button>
          </>
        }
        kpis={[
          {
            label: 'Total Expenses',
            value: formatKsh(stats?.totalExpenses ?? 0),
            icon: <Wallet className="h-4 w-4" />,
            accent: 'destructive',
          },
          {
            label: 'Records',
            value: stats?.recordCount ?? 0,
            icon: <Receipt className="h-4 w-4" />,
            accent: 'default',
          },
        ]}
        searchPlaceholder="Search description, ref, category…"
        columns={columns}
        query={query}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        emptyLabel="No expenses recorded yet"
        rowKey={(r) => r.id}
      />

      <ExpenseFormDialog open={showAdd} branchId={branchId} onClose={() => setShowAdd(false)} />

      {viewExpense && (
        <ExpenseDetailDialog expense={viewExpense}
          onClose={() => setViewExpense(null)}
          onDelete={() => { setDeleteTarget(viewExpense); setViewExpense(null); }} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this expense?"
        description={`${deleteTarget?.reference ?? 'This expense'} — ${formatKsh(deleteTarget?.amount ?? 0)} will be permanently removed.`}
        confirmLabel="Delete expense"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync({ expenseId: deleteTarget.id, delBranchId: branchId });
            toast.success('Expense deleted');
            setDeleteTarget(null);
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Could not delete expense'));
          }
        }}
      />
    </>
  );
}

// ─── Expense Form ─────────────────────────────────────────────────────────────

function ExpenseFormDialog({
  open, branchId, onClose,
}: { open: boolean; branchId: string; onClose: () => void }) {
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState(0);
  const [method, setMethod] = React.useState<ExpensePaymentMethod>('CASH');
  const [categoryId, setCategoryId] = React.useState('');
  const [accountId, setAccountId] = React.useState('');
  const [incurredAt, setIncurredAt] = React.useState(format(new Date(), 'yyyy-MM-dd'));

  const createMutation = useCreateExpense();
  const { data: categoriesData } = useExpenseCategories({ limit: 100 });
  const categories = categoriesData?.data ?? [];
  const { data: accountsData } = useAccounts({ limit: 100 });
  const accounts = (accountsData?.data ?? []) as Account[];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) { toast.error('Description is required'); return; }
    if (amount <= 0) { toast.error('Amount must be greater than zero'); return; }
    try {
      const payload: CreateExpensePayload = {
        branchId, description: description.trim(), amount, method,
        categoryId: categoryId || undefined,
        accountId: accountId || undefined,
        incurredAt: incurredAt ? new Date(incurredAt).toISOString() : undefined,
      };
      await createMutation.mutateAsync(payload);
      toast.success('Expense recorded');
      onClose();
      setDescription(''); setAmount(0); setCategoryId(''); setAccountId('');
      setMethod('CASH'); setIncurredAt(format(new Date(), 'yyyy-MM-dd'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not record expense'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-brand-600" />New Expense
          </DialogTitle>
          <DialogDescription>Record a branch expense. A reference number is auto-generated.</DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 pb-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Description <span className="text-destructive">*</span></Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Diesel for plant generator" className="h-9 text-sm" maxLength={500} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Amount (KSh) <span className="text-destructive">*</span></Label>
              <Input type="number" min={0.01} step={0.01} value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0.00" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Date</Label>
              <Input type="date" value={incurredAt}
                onChange={(e) => setIncurredAt(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Payment method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as ExpensePaymentMethod)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{EXPENSE_PAYMENT_METHOD_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="No category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Deduct from account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="No account (cash in hand)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No account</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} · {formatKsh(a.currentBalance ?? a.balance ?? 0)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={createMutation.isPending} onClick={onClose}>Cancel</Button>
          <Button variant="brand" loading={createMutation.isPending}
            disabled={amount <= 0 || !description.trim()}
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}>
            Record · {formatKsh(amount)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Expense Detail ───────────────────────────────────────────────────────────

function ExpenseDetailDialog({
  expense, onClose, onDelete,
}: { expense: Expense; onClose: () => void; onDelete: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-brand-600" />
            Expense — {expense.reference ?? expense.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-6 pb-2">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            {[
              ['Description', expense.description ?? '—'],
              ['Category', expense.category?.name ?? expense.categoryName ?? '—'],
              ['Method', EXPENSE_PAYMENT_METHOD_LABELS[expense.method as ExpensePaymentMethod] ?? expense.method ?? '—'],
              ['Date', formatDate(expense.incurredAt, 'dd MMM yyyy')],
              ['Account', expense.account?.name ?? expense.accountName ?? '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="mt-0.5 font-medium">{value}</p>
              </div>
            ))}
            <div className="col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</p>
              <p className="mt-0.5 text-xl font-bold text-destructive tabular-nums">{formatKsh(expense.amount)}</p>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="destructive" size="sm" onClick={onDelete}>Delete</Button>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
