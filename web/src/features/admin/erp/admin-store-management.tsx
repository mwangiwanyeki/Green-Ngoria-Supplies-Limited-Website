'use client';

import * as React from 'react';
import { Plus, Warehouse, Pencil, Archive, Check, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { useBranchStore } from '@/stores/branch-store';
import { getApiErrorMessage } from '@/lib/api/api-error';
import {
  useInventoryStores,
  useCreateStore,
  useUpdateStore,
  useDeleteStore,
  type InventoryStore,
} from '@/lib/api/hooks/use-inventory';

export function AdminStoreManagement() {
  const branchId = useBranchStore((s) => s.activeBranchId) ?? '';

  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  const [showAdd, setShowAdd] = React.useState(false);
  const [editStore, setEditStore] = React.useState<InventoryStore | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<InventoryStore | null>(
    null,
  );

  const query = useInventoryStores({ search, page, limit: perPage });
  const deleteMutation = useDeleteStore();

  const columns: ErpColumn<InventoryStore>[] = [
    {
      key: 'name',
      header: 'Store',
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-brand-500" />
          <span className="font-medium">{r.name}</span>
          {r.isDefault && <Badge variant="brand">Default</Badge>}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (r) =>
        r.location ? (
          <span className="text-sm">{r.location}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'description',
      header: 'Description',
      cell: (r) =>
        r.description ? (
          <span className="line-clamp-1 text-sm text-muted-foreground">
            {r.description}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'items',
      header: <span className="block text-right">Items</span>,
      cell: (r) => (
        <span className="block text-right tabular-nums text-sm">
          {r._count?.items ?? 0}
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
            title="Edit store"
            onClick={() => setEditStore(r)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:text-destructive"
            title="Archive store"
            onClick={() => setDeleteTarget(r)}
          >
            <Archive className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <ErpListPage
        title="Store Management"
        description="Storage locations and stock placement for the active branch."
        actions={
          <Button
            size="sm"
            variant="brand"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAdd(true)}
          >
            Add Store
          </Button>
        }
        searchPlaceholder="Search stores…"
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
        emptyLabel="No stores configured yet"
        rowKey={(r) => r.id}
      />

      {/* Add store */}
      <StoreFormDialog
        open={showAdd}
        branchId={branchId}
        onClose={() => setShowAdd(false)}
      />

      {/* Edit store */}
      {editStore && (
        <StoreFormDialog
          open
          branchId={branchId}
          store={editStore}
          onClose={() => setEditStore(null)}
        />
      )}

      {/* Archive confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Archive "${deleteTarget?.name}"?`}
        description="The store will be hidden and can no longer be assigned to items. Existing stock records are preserved."
        confirmLabel="Archive store"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => {
          void (async () => {
            if (!deleteTarget) return;
            try {
              await deleteMutation.mutateAsync({
                storeId: deleteTarget.id,
                deleteBranchId: branchId,
              });
              toast.success(`"${deleteTarget.name}" archived`);
              setDeleteTarget(null);
            } catch (err) {
              toast.error(getApiErrorMessage(err, 'Could not archive store'));
            }
          })();
        }}
      />
    </>
  );
}

// ─── Store Form Dialog (Add + Edit) ───────────────────────────────────────────

function StoreFormDialog({
  open,
  branchId,
  store,
  onClose,
}: {
  open: boolean;
  branchId: string;
  store?: InventoryStore | null;
  onClose: () => void;
}) {
  const isEdit = !!store;

  const [name, setName] = React.useState(store?.name ?? '');
  const [location, setLocation] = React.useState(store?.location ?? '');
  const [description, setDescription] = React.useState(
    store?.description ?? '',
  );
  const [isDefault, setIsDefault] = React.useState(store?.isDefault ?? false);

  const createMutation = useCreateStore();
  const updateMutation = useUpdateStore(store?.id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  React.useEffect(() => {
    setName(store?.name ?? '');
    setLocation(store?.location ?? '');
    setDescription(store?.description ?? '');
    setIsDefault(store?.isDefault ?? false);
  }, [store]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Store name is required');
      return;
    }
    try {
      const payload = {
        branchId,
        name: name.trim(),
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        isDefault,
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
      toast.error(getApiErrorMessage(err, 'Could not save store'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-brand-600" />
            {isEdit ? `Edit — ${store?.name}` : 'Add Store'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this storage location for the active branch.'
              : 'Create a storage location that inventory items can be assigned to.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-5 px-6 pb-2"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Store name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Store"
              maxLength={150}
              className="h-9 text-sm"
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-sm">Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Warehouse B, Nairobi"
              maxLength={255}
              className="h-9 text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-sm">Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this store…"
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>

          {/* Default toggle */}
          <button
            type="button"
            onClick={() => setIsDefault((v) => !v)}
            className={cn(
              'flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors',
              isDefault
                ? 'border-brand-500 bg-brand-500/5'
                : 'border-border hover:bg-accent',
            )}
          >
            <div className="flex items-center gap-2">
              <Star
                className={cn(
                  'h-4 w-4',
                  isDefault
                    ? 'fill-brand-500 text-brand-500'
                    : 'text-muted-foreground',
                )}
              />
              <div>
                <p className="text-sm font-medium">Default store</p>
                <p className="text-xs text-muted-foreground">
                  New items are placed here unless another store is picked.
                </p>
              </div>
            </div>
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border',
                isDefault
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-border',
              )}
            >
              {isDefault && <Check className="h-3 w-3" />}
            </span>
          </button>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="brand"
            loading={isPending}
            onClick={(e) => void handleSubmit(e)}
          >
            {isEdit ? 'Save changes' : 'Add store'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
