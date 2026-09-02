'use client';

import * as React from 'react';
import { HandCoins, AlertTriangle, Users, Eye, CreditCard, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { formatKsh } from '@/components/admin/erp-list-shell';
import { formatDate } from '@/lib/utils';
import { useBranchStore } from '@/stores/branch-store';
import { getApiErrorMessage } from '@/lib/api/api-error';
import {
  useDebtAccounts, useDebtStats, useRecordDebtPayment, useUpdateDebtAccount,
  DEBT_PAYMENT_METHODS, DEBT_PAYMENT_METHOD_LABELS, DEBT_STATUSES,
  type DebtAccount, type DebtPaymentMethod, type DebtStatus,
  type RecordDebtPaymentPayload, type UpdateDebtAccountPayload,
} from '@/lib/api/hooks/use-debt';
import { format } from 'date-fns';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

type DebtFilter = 'all' | 'CURRENT' | 'OVERDUE' | 'SETTLED';

export function AdminDebt() {
  const branchId = useBranchStore((s) => s.activeBranchId) ?? '';
  const [search, setSearch] = React.useState('');

  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = React.useState<DebtFilter>('all');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  const [viewAccount, setViewAccount] = React.useState<DebtAccount | null>(null);
  const [payAccount, setPayAccount] = React.useState<DebtAccount | null>(null);
  const [editAccount, setEditAccount] = React.useState<DebtAccount | null>(null);

  const query = useDebtAccounts({ search: debouncedSearch, page, limit: perPage,
    ...(status !== 'all' ? { status } : { }),
  });
  const { data: stats } = useDebtStats();

  const columns: ErpColumn<DebtAccount>[] = [
    {
      key: 'customer',
      header: 'Customer',
      cell: (r) => (
        <button type="button" onClick={() => setViewAccount(r)}
          className="font-medium text-sm text-brand-600 hover:underline dark:text-brand-400 text-left">
          {r.customerName}
        </button>
      ),
    },
    {
      key: 'outstanding',
      header: <span className="block text-right">Outstanding</span>,
      cell: (r) => (
        <span className={cn('block text-right tabular-nums font-semibold text-sm',
          Number(r.outstanding) > 0 ? 'text-warning-foreground' : 'text-muted-foreground')}>
          {Number(r.outstanding) > 0 ? formatKsh(r.outstanding) : '—'}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      cell: (r) =>
        r.dueDate ? (
          <span className={cn('text-xs', r.overdueDays && r.overdueDays > 0
            ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
            {formatDate(r.dueDate, 'dd MMM yyyy')}
          </span>
        ) : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'overdue',
      header: 'Overdue',
      cell: (r) =>
        r.overdueDays && r.overdueDays > 0 ? (
          <Badge variant="destructive">{r.overdueDays}d overdue</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">On time</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge variant={
          r.status === 'OVERDUE' ? 'destructive' :
          r.status === 'SETTLED' ? 'success' :
          r.status === 'WRITTEN_OFF' || r.status === 'SUSPENDED' ? 'mineral' : 'brand'
        }>
          {(r.status ?? 'CURRENT').replace(/_/g, ' ').toLowerCase()}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View account"
            onClick={() => setViewAccount(r)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {Number(r.outstanding) > 0 && r.status !== 'SETTLED' && (
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-success"
              title="Record payment" onClick={() => setPayAccount(r)}>
              <CreditCard className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
            title="Manage account" onClick={() => setEditAccount(r)}>
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <ErpListPage
        title="Manage Debt"
        description="Customer credit balances and overdue accounts."
        kpis={[
          {
            label: 'Outstanding Debt',
            value: formatKsh(stats?.totalOutstanding ?? 0),
            icon: <HandCoins className="h-4 w-4" />,
            accent: 'brand',
          },
          {
            label: 'Overdue',
            value: stats?.overdueCount ?? 0,
            icon: <AlertTriangle className="h-4 w-4" />,
            accent: 'destructive',
          },
          {
            label: 'Customers with debt',
            value: stats?.customerCount ?? 0,
            icon: <Users className="h-4 w-4" />,
            accent: 'default',
          },
        ]}
        searchPlaceholder="Search customer name, phone, company…"
        filterChips={[
          { key: 'all', label: 'All' },
          { key: 'CURRENT', label: 'Current' },
          { key: 'OVERDUE', label: 'Overdue' },
          { key: 'SETTLED', label: 'Settled' },
        ]}
        filterValue={status}
        onFilterChange={(k) => { setStatus(k as DebtFilter); setPage(1); }}
        columns={columns}
        query={query}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        emptyLabel="No debt accounts yet"
        rowKey={(r) => r.id}
      />

      {viewAccount && (
        <DebtDetailDialog
          account={viewAccount}
          onClose={() => setViewAccount(null)}
          onPay={() => { setPayAccount(viewAccount); setViewAccount(null); }}
          onManage={() => { setEditAccount(viewAccount); setViewAccount(null); }} />
      )}

      {payAccount && (
        <RecordPaymentDialog account={payAccount} branchId={branchId}
          onClose={() => setPayAccount(null)} />
      )}

      {editAccount && (
        <ManageAccountDialog account={editAccount} branchId={branchId}
          onClose={() => setEditAccount(null)} />
      )}
    </>
  );
}

// ─── Debt Detail ──────────────────────────────────────────────────────────────

function DebtDetailDialog({
  account, onClose, onPay, onManage,
}: { account: DebtAccount; onClose: () => void; onPay: () => void; onManage: () => void }) {
  const outstanding = Number(account.outstanding);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-4 w-4 text-brand-600" />{account.customerName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-6 pb-2">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            {[
              ['Status', (account.status ?? 'CURRENT').replace(/_/g, ' ')],
              ['Due Date', account.dueDate ? formatDate(account.dueDate, 'dd MMM yyyy') : '—'],
              ['Total Billed', formatKsh(account.totalBilled ?? 0)],
              ['Total Paid', formatKsh(account.totalPaid ?? 0)],
              ['Credit Limit', Number(account.creditLimit ?? 0) > 0 ? formatKsh(account.creditLimit ?? 0) : 'None'],
              ['Last Payment', account.lastPaymentAt ? formatDate(account.lastPaymentAt, 'dd MMM yyyy') : '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="mt-0.5 font-medium">{value}</p>
              </div>
            ))}
            <div className="col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</p>
              <p className={cn('mt-0.5 text-xl font-bold tabular-nums',
                outstanding > 0 ? 'text-warning-foreground' : 'text-success')}>
                {outstanding > 0 ? formatKsh(outstanding) : 'Cleared'}
              </p>
            </div>
          </div>
          {account.notes && (
            <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              {account.notes}
            </p>
          )}
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" size="sm" leftIcon={<Settings className="h-3.5 w-3.5" />}
            onClick={onManage}>Manage</Button>
          {outstanding > 0 && (
            <Button variant="brand" size="sm" leftIcon={<CreditCard className="h-3.5 w-3.5" />}
              onClick={onPay}>Record Payment</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Record Debt Payment ──────────────────────────────────────────────────────

function RecordPaymentDialog({
  account, branchId, onClose,
}: { account: DebtAccount; branchId: string; onClose: () => void }) {
  const outstanding = Number(account.outstanding);
  const [amount, setAmount] = React.useState(outstanding);
  const [method, setMethod] = React.useState<DebtPaymentMethod>('CASH');
  const [reference, setReference] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [paidAt, setPaidAt] = React.useState(format(new Date(), 'yyyy-MM-dd'));

  const payMutation = useRecordDebtPayment(account.id);
  const remaining = Math.max(0, outstanding - amount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0) { toast.error('Amount must be greater than zero'); return; }
    if (amount > outstanding) { toast.error('Payment exceeds outstanding balance'); return; }
    try {
      const payload: RecordDebtPaymentPayload = {
        branchId, amount, method,
        reference: reference || undefined,
        notes: notes || undefined,
        paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
      };
      await payMutation.mutateAsync(payload);
      toast.success(`Payment of ${formatKsh(amount)} recorded`);
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not record payment'));
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-success" />
            Debt Payment — {account.customerName}
          </DialogTitle>
          <DialogDescription>
            Outstanding: <strong>{formatKsh(outstanding)}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 pb-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Amount (KSh) <span className="text-destructive">*</span></Label>
              <Input type="number" min={0.01} max={outstanding} step={0.01}
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Payment date</Label>
              <Input type="date" value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Payment method <span className="text-destructive">*</span></Label>
            <Select value={method} onValueChange={(v) => setMethod(v as DebtPaymentMethod)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEBT_PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{DEBT_PAYMENT_METHOD_LABELS[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Reference</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)}
              placeholder="M-Pesa code, cheque no…" className="h-9 text-sm" maxLength={120} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Notes</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…" rows={2} maxLength={1000}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none" />
          </div>

          {amount > 0 && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="tabular-nums font-semibold text-warning-foreground">{formatKsh(outstanding)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">This payment</span>
                <span className="tabular-nums text-success">− {formatKsh(amount)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
                <span>Remaining</span>
                <span className={cn('tabular-nums',
                  remaining <= 0 ? 'text-success' : 'text-warning-foreground')}>
                  {remaining <= 0 ? 'Cleared' : formatKsh(remaining)}
                </span>
              </div>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={payMutation.isPending} onClick={onClose}>Cancel</Button>
          <Button variant="brand" loading={payMutation.isPending}
            disabled={amount <= 0 || amount > outstanding}
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}>
            Record · {formatKsh(amount)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manage Debt Account ──────────────────────────────────────────────────────

function ManageAccountDialog({
  account, branchId, onClose,
}: { account: DebtAccount; branchId: string; onClose: () => void }) {
  const [creditLimit, setCreditLimit] = React.useState(Number(account.creditLimit ?? 0));
  const [dueDate, setDueDate] = React.useState(
    account.dueDate ? format(new Date(account.dueDate), 'yyyy-MM-dd') : ''
  );
  const [accountStatus, setAccountStatus] = React.useState<DebtStatus>(account.status ?? 'CURRENT');
  const [notes, setNotes] = React.useState(account.notes ?? '');

  const updateMutation = useUpdateDebtAccount(account.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload: UpdateDebtAccountPayload = {
        branchId,
        creditLimit: creditLimit >= 0 ? creditLimit : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        status: accountStatus,
        notes: notes || undefined,
      };
      await updateMutation.mutateAsync(payload);
      toast.success('Debt account updated');
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update account'));
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-brand-600" />
            Manage — {account.customerName}
          </DialogTitle>
          <DialogDescription>
            Override credit limit, due date or account status. Balance-derived statuses are recalculated automatically on each payment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 pb-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Credit limit (KSh)</Label>
              <Input type="number" min={0} step={0.01} value={creditLimit || ''}
                onChange={(e) => setCreditLimit(Number(e.target.value))}
                placeholder="0 = no limit" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Due date</Label>
              <Input type="date" value={dueDate}
                onChange={(e) => setDueDate(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Account status</Label>
            <Select value={accountStatus}
              onValueChange={(v) => setAccountStatus(v as DebtStatus)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEBT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Notes</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this account…" rows={2} maxLength={1000}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none" />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={updateMutation.isPending} onClick={onClose}>Cancel</Button>
          <Button variant="brand" loading={updateMutation.isPending}
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
