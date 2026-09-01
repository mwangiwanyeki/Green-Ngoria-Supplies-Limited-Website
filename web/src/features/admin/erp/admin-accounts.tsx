'use client';

import * as React from 'react';
import {
  Plus, Landmark, FileText, Pencil, Trash2, ArrowUpDown, Eye, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
import { useBranchStore } from '@/stores/branch-store';
import { getApiErrorMessage } from '@/lib/api/api-error';
import {
  useAccounts, useAccountsSummary, useCreateAccount, useUpdateAccount,
  useManualEntry, useDeleteAccount,
  ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS, TRANSACTION_TYPES,
  type Account, type AccountType, type TransactionType,
  type CreateAccountPayload, type ManualEntryPayload,
} from '@/lib/api/hooks/use-accounts';

export function AdminAccounts() {
  const branchId = useBranchStore((s) => s.activeBranchId) ?? '';
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  const [showAdd, setShowAdd] = React.useState(false);
  const [editAccount, setEditAccount] = React.useState<Account | null>(null);
  const [manualEntryAccount, setManualEntryAccount] = React.useState<Account | null>(null);
  const [viewAccount, setViewAccount] = React.useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Account | null>(null);

  const query = useAccounts({ search, page, limit: perPage });
  const { data: summary } = useAccountsSummary();
  const deleteMutation = useDeleteAccount();

  const columns: ErpColumn<Account>[] = [
    {
      key: 'name',
      header: 'Account',
      cell: (r) => (
        <div>
          <div className="font-medium text-sm">{r.name}</div>
          {r.accountNumber && (
            <div className="font-mono text-xs text-muted-foreground">{r.accountNumber}</div>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (r) =>
        r.type ? (
          <Badge variant="outline" className="text-xs">
            {ACCOUNT_TYPE_LABELS[r.type as AccountType] ?? r.type}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'provider',
      header: 'Provider',
      cell: (r) => (
        <span className="text-sm text-muted-foreground">{r.provider ?? '—'}</span>
      ),
    },
    {
      key: 'currency',
      header: 'CCY',
      cell: (r) => (
        <Badge variant="outline" className="font-mono text-xs">{r.currency ?? 'KES'}</Badge>
      ),
    },
    {
      key: 'balance',
      header: <span className="block text-right">Balance</span>,
      cell: (r) => {
        const bal = Number(r.currentBalance ?? r.balance ?? 0);
        return (
          <span className={cn('block text-right tabular-nums font-semibold text-sm',
            bal < 0 ? 'text-destructive' : bal === 0 ? 'text-muted-foreground' : '')}>
            {formatKsh(bal)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge variant={r.isActive !== false ? 'success' : 'mineral'}>
          {r.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View"
            onClick={() => setViewAccount(r)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-brand-600"
            title="Manual entry" onClick={() => setManualEntryAccount(r)}>
            <ArrowUpDown className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
            title="Edit" onClick={() => setEditAccount(r)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-destructive"
            title="Delete" onClick={() => setDeleteTarget(r)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <ErpListPage
        title="Accounts"
        description="Financial accounts and manual ledger entries for the active branch."
        actions={
          <>
            <Button size="sm" variant="outline"
              leftIcon={<FileText className="h-4 w-4" />}
              onClick={() => toast.info('Select a row to record a manual entry')}>
              Manual Entry
            </Button>
            <Button size="sm" variant="brand"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowAdd(true)}>
              Add Account
            </Button>
          </>
        }
        kpis={[
          {
            label: 'Total Balance',
            value: formatKsh(summary?.totalBalance ?? 0),
            icon: <Landmark className="h-4 w-4" />,
            accent: 'brand',
          },
          {
            label: 'Accounts',
            value: summary?.accountCount ?? 0,
            icon: <FileText className="h-4 w-4" />,
            accent: 'default',
          },
        ]}
        searchPlaceholder="Search accounts…"
        columns={columns}
        query={query}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        emptyLabel="No accounts yet"
        rowKey={(r) => r.id}
      />

      <AccountFormDialog open={showAdd} branchId={branchId} onClose={() => setShowAdd(false)} />

      {editAccount && (
        <AccountFormDialog open branchId={branchId} account={editAccount} onClose={() => setEditAccount(null)} />
      )}

      {viewAccount && (
        <AccountDetailDialog
          account={viewAccount}
          onClose={() => setViewAccount(null)}
          onEdit={() => { setEditAccount(viewAccount); setViewAccount(null); }}
          onManualEntry={() => { setManualEntryAccount(viewAccount); setViewAccount(null); }}
        />
      )}

      {manualEntryAccount && (
        <ManualEntryDialog account={manualEntryAccount} branchId={branchId}
          onClose={() => setManualEntryAccount(null)} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="The account and its transaction history will be soft-deleted. This action can be reversed by support."
        confirmLabel="Delete account"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync({ accountId: deleteTarget.id, delBranchId: branchId });
            toast.success(`"${deleteTarget.name}" deleted`);
            setDeleteTarget(null);
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Could not delete account'));
          }
        }}
      />
    </>
  );
}

// ─── Account Form ─────────────────────────────────────────────────────────────

function AccountFormDialog({
  open, branchId, account, onClose,
}: { open: boolean; branchId: string; account?: Account | null; onClose: () => void }) {
  const isEdit = !!account;
  const [name, setName] = React.useState(account?.name ?? '');
  const [type, setType] = React.useState<AccountType>((account?.type as AccountType) ?? 'CASH');
  const [accountNumber, setAccountNumber] = React.useState(account?.accountNumber ?? '');
  const [provider, setProvider] = React.useState(account?.provider ?? '');
  const [openingBalance, setOpeningBalance] = React.useState(0);
  const [description, setDescription] = React.useState(account?.description ?? '');
  const [isActive, setIsActive] = React.useState(account?.isActive !== false);

  React.useEffect(() => {
    setName(account?.name ?? '');
    setType((account?.type as AccountType) ?? 'CASH');
    setAccountNumber(account?.accountNumber ?? '');
    setProvider(account?.provider ?? '');
    setDescription(account?.description ?? '');
    setIsActive(account?.isActive !== false);
    setOpeningBalance(0);
  }, [account]);

  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount(account?.id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('Account name is required'); return; }
    try {
      const payload: CreateAccountPayload = {
        branchId, name: name.trim(), type,
        accountNumber: accountNumber || undefined,
        provider: provider || undefined,
        description: description || undefined,
        isActive,
        ...(!isEdit ? { openingBalance: openingBalance || undefined } : {}),
      };
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        toast.success(`"${name}" updated`);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(`"${name}" created`);
      }
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save account'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-brand-600" />
            {isEdit ? `Edit — ${account?.name}` : 'New Financial Account'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update account details. Balance only moves through transactions.' : 'Create a cash, bank, mobile money or other financial account.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 pb-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Account name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. M-Pesa Till, KCB Current Account" className="h-9 text-sm" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Type <span className="text-destructive">*</span></Label>
              <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Provider / Bank</Label>
              <Input value={provider} onChange={(e) => setProvider(e.target.value)}
                placeholder="Safaricom, KCB…" className="h-9 text-sm" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Account number</Label>
              <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Till / IBAN / sort code" className="h-9 text-sm" />
            </div>
            {!isEdit && (
              <div className="space-y-1.5">
                <Label className="text-sm">Opening balance (KSh)</Label>
                <Input type="number" min={0} step={0.01} value={openingBalance || ''}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  placeholder="0.00" className="h-9 text-sm" />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Description</Label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this account…" rows={2} maxLength={500}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
            Account is active
          </label>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onClose}>Cancel</Button>
          <Button variant="brand" loading={isPending}
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}>
            {isEdit ? 'Save changes' : 'Create account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Account Detail ───────────────────────────────────────────────────────────

function AccountDetailDialog({
  account, onClose, onEdit, onManualEntry,
}: { account: Account; onClose: () => void; onEdit: () => void; onManualEntry: () => void }) {
  const bal = Number(account.currentBalance ?? account.balance ?? 0);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-brand-600" />{account.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-6 pb-2">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            {[
              ['Type', ACCOUNT_TYPE_LABELS[account.type as AccountType] ?? account.type ?? '—'],
              ['Currency', account.currency ?? 'KES'],
              ['Provider', account.provider ?? '—'],
              ['Account #', account.accountNumber ?? '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="mt-0.5 font-medium">{value}</p>
              </div>
            ))}
            <div className="col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Balance</p>
              <p className={cn('mt-0.5 text-xl font-bold tabular-nums',
                bal < 0 ? 'text-destructive' : 'text-success')}>{formatKsh(bal)}</p>
            </div>
          </div>
          {account.description && (
            <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              {account.description}
            </p>
          )}
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" size="sm" leftIcon={<ArrowUpDown className="h-3.5 w-3.5" />}
            onClick={onManualEntry}>Manual Entry</Button>
          <Button variant="brand" size="sm" leftIcon={<Pencil className="h-3.5 w-3.5" />}
            onClick={onEdit}>Edit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manual Entry ─────────────────────────────────────────────────────────────

function ManualEntryDialog({
  account, branchId, onClose,
}: { account: Account; branchId: string; onClose: () => void }) {
  const [entryType, setEntryType] = React.useState<TransactionType>('CREDIT');
  const [amount, setAmount] = React.useState(0);
  const [description, setDescription] = React.useState('');
  const [reference, setReference] = React.useState('');
  const manualEntry = useManualEntry(account.id);
  const bal = Number(account.currentBalance ?? account.balance ?? 0);
  const projected = entryType === 'CREDIT' ? bal + amount : bal - amount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0) { toast.error('Amount must be greater than zero'); return; }
    if (!description.trim()) { toast.error('Description is required'); return; }
    try {
      const payload: ManualEntryPayload = {
        branchId, type: entryType, amount,
        description: description.trim(),
        reference: reference || undefined,
      };
      await manualEntry.mutateAsync(payload);
      toast.success('Entry recorded');
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not record entry'));
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-brand-600" />
            Manual Entry — {account.name}
          </DialogTitle>
          <DialogDescription>
            Current balance: <strong>{formatKsh(bal)}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 pb-2">
          <div className="flex gap-2 rounded-md border border-border bg-muted/30 p-1">
            {TRANSACTION_TYPES.map((t) => (
              <button key={t} type="button"
                onClick={() => setEntryType(t)}
                className={cn('flex-1 rounded py-1.5 text-xs font-semibold transition-colors',
                  entryType === t
                    ? t === 'CREDIT' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    : 'text-muted-foreground hover:bg-accent')}>
                {t === 'CREDIT' ? '+ Credit (adds)' : '− Debit (removes)'}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Amount (KSh) <span className="text-destructive">*</span></Label>
            <Input type="number" min={0.01} step={0.01} value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="0.00" className="h-9 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Description <span className="text-destructive">*</span></Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Cash banked from till" className="h-9 text-sm" maxLength={500} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Reference</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)}
              placeholder="Slip no., M-Pesa code…" className="h-9 text-sm" maxLength={120} />
          </div>

          {amount > 0 && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current balance</span>
                <span className="tabular-nums">{formatKsh(bal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{entryType === 'CREDIT' ? 'Adding' : 'Removing'}</span>
                <span className={cn('tabular-nums font-semibold',
                  entryType === 'CREDIT' ? 'text-success' : 'text-destructive')}>
                  {entryType === 'CREDIT' ? '+' : '−'}{formatKsh(amount)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
                <span>New balance</span>
                <span className={cn('tabular-nums', projected < 0 ? 'text-destructive' : 'text-success')}>
                  {formatKsh(projected)}
                </span>
              </div>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={manualEntry.isPending} onClick={onClose}>Cancel</Button>
          <Button variant="brand" loading={manualEntry.isPending}
            disabled={amount <= 0 || !description.trim()}
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}>
            Record entry · {formatKsh(amount)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
