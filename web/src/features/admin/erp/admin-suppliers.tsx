'use client';

import * as React from 'react';
import {
  Plus, Truck, Eye, Pencil, CheckCircle2, Globe, Mail, Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { formatDate } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api/api-error';
import {
  useSuppliers, useCreateSupplier, useUpdateSupplier, useApproveSupplier,
  type Supplier, type CreateSupplierPayload,
} from '@/lib/api/hooks/use-suppliers';

export function AdminSuppliers() {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  const [showAdd, setShowAdd] = React.useState(false);
  const [editSupplier, setEditSupplier] = React.useState<Supplier | null>(null);
  const [viewSupplier, setViewSupplier] = React.useState<Supplier | null>(null);

  const query = useSuppliers({ search, page, limit: perPage });

  const columns: ErpColumn<Supplier>[] = [
    {
      key: 'name',
      header: 'Supplier',
      cell: (r) => (
        <div>
          <button
            type="button"
            onClick={() => setViewSupplier(r)}
            className="font-medium text-sm text-brand-600 hover:underline dark:text-brand-400 text-left"
          >
            {r.name}
          </button>
          {r.contactName && (
            <div className="text-xs text-muted-foreground">{r.contactName}</div>
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
      key: 'country',
      header: 'Country',
      cell: (r) => (
        <span className="text-sm text-muted-foreground">{r.country ?? '—'}</span>
      ),
    },
    {
      key: 'specializations',
      header: 'Specializations',
      cell: (r) =>
        r.specializations?.length ? (
          <div className="flex flex-wrap gap-1">
            {r.specializations.slice(0, 2).map((s) => (
              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
            ))}
            {r.specializations.length > 2 && (
              <Badge variant="outline" className="text-xs">+{r.specializations.length - 2}</Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge variant={r.isApproved ? 'success' : 'warning'}>
          {r.isApproved ? 'Approved' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'added',
      header: 'Added',
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(r.createdAt, 'dd MMM yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View"
            onClick={() => setViewSupplier(r)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit"
            onClick={() => setEditSupplier(r)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {!r.isApproved && (
            <ApproveButton vendorId={r.id} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <ErpListPage
        title="Suppliers"
        description="Approved vendors and procurement contacts."
        actions={
          <Button size="sm" variant="brand"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAdd(true)}>
            Add Supplier
          </Button>
        }
        searchPlaceholder="Search name, contact, email…"
        columns={columns}
        query={query as never}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        emptyLabel="No suppliers yet"
        rowKey={(r) => r.id}
      />

      <SupplierFormDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
      />

      {editSupplier && (
        <SupplierFormDialog
          open
          supplier={editSupplier}
          onClose={() => setEditSupplier(null)}
        />
      )}

      {viewSupplier && (
        <SupplierDetailDialog
          supplier={viewSupplier}
          onClose={() => setViewSupplier(null)}
          onEdit={() => { setEditSupplier(viewSupplier); setViewSupplier(null); }}
        />
      )}
    </>
  );
}

// ─── Approve button (isolated to own mutation instance) ───────────────────────

function ApproveButton({ vendorId }: { vendorId: string }) {
  const approveMutation = useApproveSupplier(vendorId);
  return (
    <Button size="sm" variant="ghost"
      className="h-7 w-7 p-0 hover:text-success"
      title="Approve supplier"
      loading={approveMutation.isPending}
      onClick={async () => {
        try {
          await approveMutation.mutateAsync();
          toast.success('Supplier approved');
        } catch (err) {
          toast.error(getApiErrorMessage(err, 'Could not approve supplier'));
        }
      }}>
      <CheckCircle2 className="h-3.5 w-3.5" />
    </Button>
  );
}

// ─── Supplier Form ────────────────────────────────────────────────────────────

function SupplierFormDialog({
  open, supplier, onClose,
}: { open: boolean; supplier?: Supplier | null; onClose: () => void }) {
  const isEdit = !!supplier;
  const [name, setName] = React.useState(supplier?.name ?? '');
  const [contactName, setContactName] = React.useState(supplier?.contactName ?? '');
  const [email, setEmail] = React.useState(supplier?.email ?? '');
  const [phone, setPhone] = React.useState(supplier?.phone ?? '');
  const [country, setCountry] = React.useState(supplier?.country ?? 'Kenya');
  const [address, setAddress] = React.useState(supplier?.address ?? '');
  const [taxPin, setTaxPin] = React.useState(supplier?.taxPin ?? '');
  const [website, setWebsite] = React.useState(supplier?.website ?? '');
  const [specializationsRaw, setSpecializationsRaw] = React.useState(
    (supplier?.specializations ?? []).join(', ')
  );
  const [notes, setNotes] = React.useState(supplier?.notes ?? '');

  React.useEffect(() => {
    setName(supplier?.name ?? '');
    setContactName(supplier?.contactName ?? '');
    setEmail(supplier?.email ?? '');
    setPhone(supplier?.phone ?? '');
    setCountry(supplier?.country ?? 'Kenya');
    setAddress(supplier?.address ?? '');
    setTaxPin(supplier?.taxPin ?? '');
    setWebsite(supplier?.website ?? '');
    setSpecializationsRaw((supplier?.specializations ?? []).join(', '));
    setNotes(supplier?.notes ?? '');
  }, [supplier]);

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier(supplier?.id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('Supplier name is required'); return; }
    const specializations = specializationsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const payload: CreateSupplierPayload = {
        name: name.trim(),
        contactName: contactName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        country: country || undefined,
        address: address || undefined,
        taxPin: taxPin || undefined,
        website: website || undefined,
        specializations: specializations.length ? specializations : undefined,
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
      toast.error(getApiErrorMessage(err, 'Could not save supplier'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-brand-600" />
            {isEdit ? `Edit — ${supplier?.name}` : 'Add Supplier'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update supplier details.'
              : 'Register a new supplier or vendor for procurement.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 pb-2">
          {/* Name + contact */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">
                Supplier / company name <span className="text-destructive">*</span>
              </Label>
              <Input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Weir Minerals Africa" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Contact person</Label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)}
                placeholder="Primary contact name" className="h-9 text-sm" />
            </div>
          </div>

          {/* Phone + email */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 700 000000" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@supplier.com" className="h-9 text-sm" />
            </div>
          </div>

          {/* Country + Tax PIN */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)}
                placeholder="Kenya" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Tax PIN / KRA PIN</Label>
              <Input value={taxPin} onChange={(e) => setTaxPin(e.target.value)}
                placeholder="P0000000000A" className="h-9 text-sm" />
            </div>
          </div>

          {/* Address + website */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Physical or postal address" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://supplier.com" className="h-9 text-sm" />
            </div>
          </div>

          {/* Specializations */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Specializations{' '}
              <span className="text-xs text-muted-foreground font-normal">
                (comma-separated)
              </span>
            </Label>
            <Input value={specializationsRaw}
              onChange={(e) => setSpecializationsRaw(e.target.value)}
              placeholder="e.g. CIP Equipment, Grinding Media, Reagents"
              className="h-9 text-sm" />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm">Notes</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this supplier…" rows={2} maxLength={1000}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none" />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onClose}>Cancel</Button>
          <Button variant="brand" loading={isPending}
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}>
            {isEdit ? 'Save changes' : 'Add supplier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Supplier Detail ──────────────────────────────────────────────────────────

function SupplierDetailDialog({
  supplier, onClose, onEdit,
}: { supplier: Supplier; onClose: () => void; onEdit: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-brand-600" />
            {supplier.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-6 pb-2">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            {[
              ['Contact', supplier.contactName ?? '—'],
              ['Status', supplier.isApproved ? 'Approved' : 'Pending approval'],
              ['Country', supplier.country ?? '—'],
              ['Tax PIN', supplier.taxPin ?? '—'],
              ['Added', formatDate(supplier.createdAt, 'dd MMM yyyy')],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="mt-0.5 font-medium text-sm">{value}</p>
              </div>
            ))}
          </div>

          {/* Contact links */}
          <div className="flex flex-wrap gap-2">
            {supplier.phone && (
              <a href={`tel:${supplier.phone}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                <Phone className="h-3.5 w-3.5" />{supplier.phone}
              </a>
            )}
            {supplier.email && (
              <a href={`mailto:${supplier.email}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                <Mail className="h-3.5 w-3.5" />{supplier.email}
              </a>
            )}
            {supplier.website && (
              <a href={supplier.website} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                <Globe className="h-3.5 w-3.5" />Website
              </a>
            )}
          </div>

          {/* Specializations */}
          {supplier.specializations?.length ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Specializations
              </p>
              <div className="flex flex-wrap gap-1.5">
                {supplier.specializations.map((s) => (
                  <Badge key={s} variant="outline">{s}</Badge>
                ))}
              </div>
            </div>
          ) : null}

          {/* Address */}
          {supplier.address && (
            <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              {supplier.address}
            </p>
          )}

          {/* Notes */}
          {supplier.notes && (
            <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Note: </span>
              {supplier.notes}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="brand" size="sm" leftIcon={<Pencil className="h-3.5 w-3.5" />}
            onClick={onEdit}>
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
