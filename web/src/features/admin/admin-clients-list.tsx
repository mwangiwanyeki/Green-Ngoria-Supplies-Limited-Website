'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Plus, Download, Building2, Eye, Pencil, Trash2,
  Phone, Mail, MapPin, UserPlus, MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { PageHeader, EmptyState, ErrorState } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { PageSkeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  useClients, useCreateClient, useUpdateClient, useDeleteClient, useAddContact,
} from '@/lib/api/hooks/use-clients';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { compact } from '@/lib/api/payload';
import { formatRelativeDate, formatDate } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  clientNumber: string;
  companyName: string;
  industry: string | null;
  country: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  miningInterest: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  primaryContact?: { firstName: string; lastName: string; email?: string | null; phone?: string | null } | null;
  _count?: { projects: number; quotations: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  'Mining', 'Construction', 'Engineering', 'Energy & Petroleum',
  'Agriculture', 'Manufacturing', 'Finance', 'Government', 'NGO', 'Other',
] as const;

const selectClass =
  'h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

// ─── Row actions ──────────────────────────────────────────────────────────────

interface RowHandlers {
  onEdit: (c: Client) => void;
  onAddContact: (c: Client) => void;
  onArchive: (c: Client) => void;
}

function RowActions({ client, handlers }: { client: Client; handlers: RowHandlers }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Row actions">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4}
          className="z-50 min-w-[180px] rounded-xl border border-border bg-card p-1 shadow-xl">
          <DropdownMenu.Item asChild>
            <Link href={`/admin/clients/${client.id}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted">
              <Eye className="h-3.5 w-3.5" /> View details
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onEdit(client)}>
            <Pencil className="h-3.5 w-3.5" /> Edit client
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted"
            onSelect={() => handlers.onAddContact(client)}>
            <UserPlus className="h-3.5 w-3.5" /> Add contact
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive outline-none cursor-pointer hover:bg-destructive/10"
            onSelect={() => handlers.onArchive(client)}>
            <Trash2 className="h-3.5 w-3.5" /> Archive client
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function buildColumns(handlers: RowHandlers): ColumnDef<Client>[] {
  return [
    {
      accessorKey: 'clientNumber',
      header: 'Client #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.clientNumber}
        </span>
      ),
    },
    {
      accessorKey: 'companyName',
      header: 'Company',
      cell: ({ row }) => (
        <div>
          <Link href={`/admin/clients/${row.original.id}`}
            className="font-medium hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            {row.original.companyName}
          </Link>
          {row.original.industry && (
            <span className="text-xs text-muted-foreground">{row.original.industry}</span>
          )}
        </div>
      ),
    },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) => {
        const parts = [row.original.city, row.original.country].filter(Boolean);
        return parts.length ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />{parts.join(', ')}
          </span>
        ) : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      id: 'contact',
      header: 'Primary Contact',
      cell: ({ row }) => {
        const c = row.original.primaryContact;
        if (!c) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div className="space-y-0.5">
            <div className="text-sm font-medium">{c.firstName} {c.lastName}</div>
            {c.email && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />{c.email}
              </div>
            )}
            {c.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />{c.phone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'activity',
      header: 'Activity',
      cell: ({ row }) => {
        const c = row.original._count;
        if (!c) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div>{c.projects} project{c.projects !== 1 ? 's' : ''}</div>
            <div>{c.quotations} quotation{c.quotations !== 1 ? 's' : ''}</div>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <RowActions client={row.original} handlers={handlers} />,
    },
  ];
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminClientsList() {
  const { data: user } = useMe();
  const orgId = user?.organizationId ?? '';

  const { data, isLoading, isError, refetch } = useClients(orgId);
  const clients = (data?.data ?? []) as Client[];

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Client | null>(null);
  const [archiving, setArchiving] = React.useState<Client | null>(null);
  const [contactTarget, setContactTarget] = React.useState<Client | null>(null);

  const createClient = useCreateClient(orgId);
  const updateClient = useUpdateClient(orgId, editing?.id ?? '');
  const archiveClient = useDeleteClient(orgId);

  // ── Form state ──
  const [companyName, setCompanyName] = React.useState('');
  const [industry, setIndustry] = React.useState('');
  const [country, setCountry] = React.useState('Kenya');
  const [city, setCity] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [miningInterest, setMiningInterest] = React.useState('');
  const [notes, setNotes] = React.useState('');

  function openCreate() {
    setEditing(null);
    setCompanyName(''); setIndustry(''); setCountry('Kenya'); setCity('');
    setEmail(''); setPhone(''); setWebsite(''); setMiningInterest(''); setNotes('');
    setDialogOpen(true);
  }

  function openEdit(c: Client) {
    setEditing(c);
    setCompanyName(c.companyName);
    setIndustry(c.industry ?? '');
    setCountry(c.country ?? 'Kenya');
    setCity(c.city ?? '');
    setEmail(c.email ?? '');
    setPhone(c.phone ?? '');
    setWebsite(c.website ?? '');
    setMiningInterest(c.miningInterest ?? '');
    setNotes(c.notes ?? '');
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) { toast.error('Company name is required'); return; }
    const payload = compact({
      companyName: companyName.trim(),
      industry: industry || undefined,
      country: country || undefined,
      city: city || undefined,
      email: email || undefined,
      phone: phone || undefined,
      website: website || undefined,
      miningInterest: miningInterest || undefined,
      notes: notes || undefined,
    });
    try {
      if (editing) {
        await updateClient.mutateAsync(payload);
        toast.success(`"${companyName}" updated`);
      } else {
        await createClient.mutateAsync(payload);
        toast.success(`"${companyName}" added`);
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, editing ? 'Could not update client' : 'Could not create client'));
    }
  }

  // ── Export ──
  function handleExport() {
    if (!clients.length) { toast.error('No data to export'); return; }
    const headers = ['Client #', 'Company', 'Industry', 'Country', 'City', 'Email', 'Phone', 'Projects', 'Status', 'Created'];
    const csv = [headers.join(','), ...clients.map((c) => [
      c.clientNumber, c.companyName, c.industry ?? '', c.country ?? '', c.city ?? '',
      c.email ?? '', c.phone ?? '', c._count?.projects ?? 0,
      c.isActive ? 'Active' : 'Inactive',
      formatDate(c.createdAt, 'dd/MM/yyyy'),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `clients-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Export ready');
  }

  const columns = React.useMemo(() => buildColumns({
    onEdit: openEdit,
    onAddContact: setContactTarget,
    onArchive: setArchiving,
  }), []);

  const saving = createClient.isPending || updateClient.isPending;

  // ── KPIs ──
  const active = clients.filter((c) => c.isActive).length;
  const withProjects = clients.filter((c) => (c._count?.projects ?? 0) > 0).length;

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => void refetch()} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Clients"
        description="Engineering clients and project owners connected to assessments, quotations and contracts."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline"
              leftIcon={<Download className="h-4 w-4" />} onClick={handleExport}>
              Export
            </Button>
            <Button size="sm" variant="brand"
              leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Add Client
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Clients', value: clients.length },
          { label: 'Active', value: active },
          { label: 'With Projects', value: withProjects },
          { label: 'Inactive', value: clients.length - active },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold mt-1">{kpi.value}</p>
          </div>
        ))}
      </motion.div>

      {clients.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No clients yet"
          description="Add your first client to start tracking projects, quotations and invoices."
          action={
            <Button variant="brand" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Add Client
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={clients}
          searchColumn="companyName"
          searchPlaceholder="Search by company, number…"
        />
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!saving) setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-600" />
              {editing ? `Edit — ${editing.companyName}` : 'Add Client'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update client details. Client number is auto-assigned and cannot be changed.'
                : 'Register a new engineering client. A unique client number is assigned automatically.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 pb-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Company name <span className="text-destructive">*</span></Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acacia Mining Ltd" className="h-9 text-sm" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Industry</Label>
                <select value={industry} onChange={(e) => setIndustry(e.target.value)}
                  className={selectClass}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Country</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)}
                  placeholder="Kenya" className="h-9 text-sm" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm">City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)}
                  placeholder="Nairobi" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 700 000 000" className="h-9 text-sm" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@company.com" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://company.com" className="h-9 text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Mining interest</Label>
              <Input value={miningInterest} onChange={(e) => setMiningInterest(e.target.value)}
                placeholder="e.g. Gold processing plant construction, CIP/CIL system"
                className="h-9 text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Notes</Label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes about this client…" rows={2} maxLength={1000}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none" />
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="brand" loading={saving}
              onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}>
              {editing ? 'Save changes' : 'Add client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact dialog */}
      {contactTarget && (
        <AddContactDialog
          orgId={orgId}
          client={contactTarget}
          onClose={() => setContactTarget(null)}
        />
      )}

      {/* Archive confirm */}
      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(o) => !o && setArchiving(null)}
        title={`Archive "${archiving?.companyName}"?`}
        description="The client will be marked inactive. Their projects, quotations and invoices are preserved."
        confirmLabel="Archive client"
        loading={archiveClient.isPending}
        onConfirm={async () => {
          if (!archiving) return;
          try {
            await archiveClient.mutateAsync(archiving.id);
            toast.success(`"${archiving.companyName}" archived`);
            setArchiving(null);
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Could not archive client'));
          }
        }}
      />
    </div>
  );
}

// ─── Add Contact Dialog ───────────────────────────────────────────────────────

function AddContactDialog({
  orgId, client, onClose,
}: { orgId: string; client: Client; onClose: () => void }) {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [position, setPosition] = React.useState('');
  const [isPrimary, setIsPrimary] = React.useState(false);
  const [notes, setNotes] = React.useState('');

  const addContact = useAddContact(orgId, client.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }
    try {
      await addContact.mutateAsync(compact({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email || undefined,
        phone: phone || undefined,
        position: position || undefined,
        isPrimary,
        notes: notes || undefined,
      }));
      toast.success(`${firstName} ${lastName} added to ${client.companyName}`);
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not add contact'));
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-brand-600" />
            Add Contact — {client.companyName}
          </DialogTitle>
          <DialogDescription>
            Add a contact person for this client. Mark as primary to display them in the client list.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 pb-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">First name <span className="text-destructive">*</span></Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                placeholder="John" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Last name <span className="text-destructive">*</span></Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe" className="h-9 text-sm" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 700 000 000" className="h-9 text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Position / Title</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Mining Director, Procurement Manager" className="h-9 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)} className="h-4 w-4" />
            Set as primary contact
          </label>
          <div className="space-y-1.5">
            <Label className="text-sm">Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes" className="h-9 text-sm" />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={addContact.isPending} onClick={onClose}>Cancel</Button>
          <Button variant="brand" loading={addContact.isPending}
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}>
            Add contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
