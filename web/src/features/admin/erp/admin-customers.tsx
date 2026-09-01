'use client';

import * as React from 'react';
import { Plus, Users, Eye, Pencil, Trash2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { formatKsh } from '@/components/admin/erp-list-shell';
import { formatDate } from '@/lib/utils';
import { useBranchStore } from '@/stores/branch-store';
import { getApiErrorMessage } from '@/lib/api/api-error';
import {
  useErpCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer,
  type ErpCustomer, type CreateCustomerPayload,
} from '@/lib/api/hooks/use-erp-customers';

export function AdminCustomers() {
  const branchId = useBranchStore((s) => s.activeBranchId) ?? '';
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  const [showAdd, setShowAdd] = React.useState(false);
  const [editCustomer, setEditCustomer] = React.useState<ErpCustomer | null>(null);
  const [viewCustomer, setViewCustomer] = React.useState<ErpCustomer | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ErpCustomer | null>(null);

  const query = useErpCustomers({ search, page, limit: perPage });
  const deleteMutation = useDeleteCustomer();

  const columns: ErpColumn<ErpCustomer>[] = [
    {
      key: 'name',
      header: 'Customer',
      cell: (r) => (
        <div>
          <button type="button" onClick={() => setViewCustomer(r)}
            className="font-medium text-sm text-brand-600 hover:underline dark:text-brand-400 text-left">
            {r.name}
          </button>
          {r.company && (
            <div className="text-xs text-muted-foreground">{r.company}</div>
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (r) => (
        <span className="font-mono text-xs">{r.phone ?? <span className="text-muted-foreground">—</span>}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      cell: (r) => (
        <span className="text-sm text-muted-foreground">{r.email ?? '—'}</span>
      ),
    },
    {
      key: 'balance',
      header: <span className="block text-right">Debt Balance</span>,
      cell: (r) => {
        const bal = Number(r.balance ?? 0);
        return (
          <span className={`block text-right tabular-nums text-sm ${bal > 0 ? 'font-semibold text-warning-foreground' : 'text-muted-foreground'}`}>
            {bal > 0 ? formatKsh(bal) : '—'}
          </span>
        );
      },
    },
    {
      key: 'total',
      header: <span className="block text-right">Total Purchases</span>,
      cell: (r) => (
        <span className="block text-right tabular-nums text-sm">
          {Number(r.totalPurchases ?? 0) > 0 ? formatKsh(r.totalPurchases ?? 0) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View"
            onClick={() => setViewCustomer(r)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit"
            onClick={() => setEditCustomer(r)}>
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
        title="Customers"
        description="Retail and credit customers for the active branch."
        actions={
          <Button size="sm" variant="brand"
            leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>
            Add Customer
          </Button>
        }
        searchPlaceholder="Search name, phone, email, company…"
        columns={columns}
        query={query}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        emptyLabel="No customers yet"
        rowKey={(r) => r.id}
      />

      <CustomerFormDialog open={showAdd} branchId={branchId} onClose={() => setShowAdd(false)} />

      {editCustomer && (
        <CustomerFormDialog open branchId={branchId} customer={editCustomer}
          onClose={() => setEditCustomer(null)} />
      )}

      {viewCustomer && (
        <CustomerDetailDialog
          customer={viewCustomer}
          onClose={() => setViewCustomer(null)}
          onEdit={() => { setEditCustomer(viewCustomer); setViewCustomer(null); }} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="The customer record will be archived. Associated sales and debt history are preserved."
        confirmLabel="Delete customer"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync({ customerId: deleteTarget.id, delBranchId: branchId });
            toast.success(`"${deleteTarget.name}" deleted`);
            setDeleteTarget(null);
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Could not delete customer'));
          }
        }}
      />
    </>
  );
}

// ─── Customer Form ────────────────────────────────────────────────────────────

function CustomerFormDialog({
  open, branchId, customer, onClose,
}: { open: boolean; branchId: string; customer?: ErpCustomer | null; onClose: () => void }) {
  const isEdit = !!customer;
  const [name, setName] = React.useState(customer?.name ?? '');
  const [phone, setPhone] = React.useState(customer?.phone ?? '');
  const [email, setEmail] = React.useState(customer?.email ?? '');
  const [company, setCompany] = React.useState(customer?.company ?? '');
  const [address, setAddress] = React.useState(customer?.address ?? '');
  const [notes, setNotes] = React.useState(customer?.notes ?? '');

  React.useEffect(() => {
    setName(customer?.name ?? '');
    setPhone(customer?.phone ?? '');
    setEmail(customer?.email ?? '');
    setCompany(customer?.company ?? '');
    setAddress(customer?.address ?? '');
    setNotes(customer?.notes ?? '');
  }, [customer]);

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer(customer?.id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('Customer name is required'); return; }
    try {
      const payload: CreateCustomerPayload = {
        branchId, name: name.trim(),
        phone: phone || undefined,
        email: email || undefined,
        company: company || undefined,
        address: address || undefined,
        notes: notes || undefined,
      };
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        toast.success(`"${name}" updated`);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(`"${name}" added`);
      }
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save customer'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-600" />
            {isEdit ? `Edit — ${customer?.name}` : 'Add Customer'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update customer details.' : 'Add a retail or credit customer to this branch.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 pb-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Full name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Wanjiku" className="h-9 text-sm" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+254712345678" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com" className="h-9 text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Company</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name (optional)" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Physical or postal address" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Notes</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional internal notes…" rows={2} maxLength={1000}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none" />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onClose}>Cancel</Button>
          <Button variant="brand" loading={isPending}
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}>
            {isEdit ? 'Save changes' : 'Add customer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Customer Detail ──────────────────────────────────────────────────────────

function CustomerDetailDialog({
  customer, onClose, onEdit,
}: { customer: ErpCustomer; onClose: () => void; onEdit: () => void }) {
  const balance = Number(customer.balance ?? 0);
  const purchases = Number(customer.totalPurchases ?? 0);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-600" />{customer.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-6 pb-2">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            {[
              ['Phone', customer.phone ?? '—'],
              ['Email', customer.email ?? '—'],
              ['Company', customer.company ?? '—'],
              ['Customer #', customer.customerNumber ?? '—'],
              ['Member since', formatDate(customer.createdAt, 'dd MMM yyyy')],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="mt-0.5 font-medium text-sm">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground">Debt balance</p>
              <p className={`text-lg font-bold tabular-nums mt-1 ${balance > 0 ? 'text-warning-foreground' : 'text-success'}`}>
                {balance > 0 ? formatKsh(balance) : 'None'}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground">Total purchases</p>
              <p className="text-lg font-bold tabular-nums mt-1 text-brand-600">
                {purchases > 0 ? formatKsh(purchases) : '—'}
              </p>
            </div>
          </div>
          {customer.address && (
            <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              {customer.address}
            </p>
          )}
          {customer.notes && (
            <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Note: </span>{customer.notes}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="brand" size="sm" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={onEdit}>
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
