'use client';

import * as React from 'react';
import {
  Download,
  Plus,
  Tag,
  Package,
  PackageX,
  Boxes,
  Pencil,
  Archive,
  ArrowUpDown,
  Eye,
  X,
  AlertTriangle,
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErpListPage, type ErpColumn } from './erp-list-page';
import { formatKsh } from '@/components/admin/erp-list-shell';
import { useBranchStore } from '@/stores/branch-store';
import { getApiErrorMessage } from '@/lib/api/api-error';
import { format } from 'date-fns';
import {
  useInventoryItems,
  useInventoryStats,
  useInventoryCategories,
  useInventoryStores,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useAdjustStock,
  useArchiveInventoryItem,
  STOCK_MOVEMENT_TYPES,
  STOCK_MOVEMENT_TYPE_LABELS,
  type InventoryItem,
  type StockMovementType,
} from '@/lib/api/hooks/use-inventory';

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminInventory() {
  const branchId = useBranchStore((s) => s.activeBranchId) ?? '';

  // List state
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'low' | 'out'>('all');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  // Dialog state
  const [showAdd, setShowAdd] = React.useState(false);
  const [editItem, setEditItem] = React.useState<InventoryItem | null>(null);
  const [adjustItem, setAdjustItem] = React.useState<InventoryItem | null>(null);
  const [viewItem, setViewItem] = React.useState<InventoryItem | null>(null);
  const [archiveTarget, setArchiveTarget] = React.useState<InventoryItem | null>(null);

  const query = useInventoryItems({ search, filter, page, limit: perPage });
  const { data: stats } = useInventoryStats();
  const archiveMutation = useArchiveInventoryItem();

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns: ErpColumn<InventoryItem>[] = [
    {
      key: 'item',
      header: 'Item',
      cell: (r) => (
        <div>
          <div className="font-medium text-sm">{r.name}</div>
          {r.category?.name && (
            <div className="text-xs text-muted-foreground">{r.category.name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">{r.sku}</span>
      ),
    },
    {
      key: 'price',
      header: <span className="block text-right">Sell Price</span>,
      cell: (r) => (
        <span className="block text-right tabular-nums text-sm">
          {formatKsh(r.unitPrice ?? 0)}
        </span>
      ),
    },
    {
      key: 'cost',
      header: <span className="block text-right">Cost</span>,
      cell: (r) => (
        <span className="block text-right tabular-nums text-sm text-muted-foreground">
          {Number(r.costPrice ?? 0) > 0 ? formatKsh(r.costPrice ?? 0) : '—'}
        </span>
      ),
    },
    {
      key: 'qty',
      header: <span className="block text-right">Qty</span>,
      cell: (r) => {
        const qty = r.quantity ?? 0;
        const reorder = r.reorderLevel ?? 10;
        return (
          <span
            className={cn(
              'block text-right tabular-nums text-sm font-medium',
              qty <= 0
                ? 'text-destructive'
                : qty <= reorder
                  ? 'text-warning-foreground'
                  : 'text-success',
            )}
          >
            {qty}
          </span>
        );
      },
    },
    {
      key: 'uom',
      header: 'Unit',
      cell: (r) => (
        <span className="text-xs text-muted-foreground">{r.unitOfMeasure ?? 'pcs'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => {
        const qty = r.quantity ?? 0;
        const reorder = r.reorderLevel ?? 10;
        if (qty <= 0) return <Badge variant="destructive">Out of stock</Badge>;
        if (qty <= reorder) return <Badge variant="warning">Low stock</Badge>;
        return <Badge variant="success">In stock</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View"
            onClick={() => setViewItem(r)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit item"
            onClick={() => setEditItem(r)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-brand-600"
            title="Adjust stock" onClick={() => setAdjustItem(r)}>
            <ArrowUpDown className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-destructive"
            title="Archive item" onClick={() => setArchiveTarget(r)}>
            <Archive className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  // ── Export ────────────────────────────────────────────────────────────────
  function handleExport() {
    const rows = query.data?.data ?? [];
    if (rows.length === 0) { toast.error('No data to export'); return; }
    const headers = ['SKU', 'Name', 'Category', 'Unit', 'Sell Price', 'Cost Price', 'Qty', 'Reorder Level', 'Status'];
    const csv = [
      headers.join(','),
      ...rows.map((r) => {
        const qty = r.quantity ?? 0;
        const reorder = r.reorderLevel ?? 10;
        const status = qty <= 0 ? 'Out of stock' : qty <= reorder ? 'Low stock' : 'In stock';
        return [
          r.sku,
          r.name,
          r.category?.name ?? '',
          r.unitOfMeasure ?? 'pcs',
          Number(r.unitPrice ?? 0).toFixed(2),
          Number(r.costPrice ?? 0).toFixed(2),
          qty,
          reorder,
          status,
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
      }),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export ready');
  }

  // ── Price tags print ──────────────────────────────────────────────────────
  function handlePriceTags() {
    const rows = query.data?.data ?? [];
    if (rows.length === 0) { toast.error('No items to print tags for'); return; }
    const html = `<!DOCTYPE html><html><head><title>Price Tags</title><style>
      body{margin:0;font-family:sans-serif}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px}
      .tag{border:1px solid #000;padding:8px;text-align:center;break-inside:avoid}
      .name{font-size:11px;font-weight:600;margin-bottom:4px}
      .sku{font-size:8px;color:#666;margin-bottom:4px}
      .price{font-size:16px;font-weight:700}
      @media print{@page{size:A4}}
    </style></head><body><div class="grid">
    ${rows.map((r) => `
      <div class="tag">
        <div class="name">${r.name}</div>
        <div class="sku">${r.sku}</div>
        <div class="price">KSh ${Number(r.unitPrice ?? 0).toLocaleString()}</div>
      </div>`).join('')}
    </div></body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  }

  return (
    <>
      <ErpListPage
        title="Inventory"
        description="Stock items scoped to the active branch."
        actions={
          <>
            <Button size="sm" variant="outline"
              leftIcon={<Download className="h-4 w-4" />} onClick={handleExport}>
              Export
            </Button>
            <Button size="sm" variant="outline"
              leftIcon={<Tag className="h-4 w-4" />} onClick={handlePriceTags}>
              Price Tags
            </Button>
            <Button size="sm" variant="brand"
              leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>
              Add Item
            </Button>
          </>
        }
        kpis={[
          {
            label: 'Stock on Hand',
            value: formatKsh(stats?.stockOnHandValue ?? 0),
            sub: `${stats?.totalItems ?? 0} items`,
            icon: <Boxes className="h-4 w-4" />,
            accent: 'brand',
          },
          {
            label: 'In Stock',
            value: stats?.inStockCount ?? 0,
            icon: <Package className="h-4 w-4" />,
            accent: 'success',
          },
          {
            label: 'Low Stock',
            value: stats?.lowStockCount ?? 0,
            icon: <Package className="h-4 w-4" />,
            accent: 'warning',
          },
          {
            label: 'Out of Stock',
            value: stats?.outOfStockCount ?? 0,
            icon: <PackageX className="h-4 w-4" />,
            accent: 'destructive',
          },
        ]}
        searchPlaceholder="Search by name, SKU, category…"
        filterChips={[
          { key: 'all', label: 'All' },
          { key: 'low', label: 'Low Stock' },
          { key: 'out', label: 'Out of Stock' },
        ]}
        filterValue={filter}
        onFilterChange={(k) => { setFilter(k as 'all' | 'low' | 'out'); setPage(1); }}
        columns={columns}
        query={query}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        emptyLabel="No inventory items yet"
        rowKey={(r) => r.id}
      />

      {/* Add item */}
      <ItemFormDialog
        open={showAdd}
        branchId={branchId}
        onClose={() => setShowAdd(false)}
      />

      {/* Edit item */}
      {editItem && (
        <ItemFormDialog
          open
          branchId={branchId}
          item={editItem}
          onClose={() => setEditItem(null)}
        />
      )}

      {/* View item detail */}
      {viewItem && (
        <ItemDetailDialog
          item={viewItem}
          onClose={() => setViewItem(null)}
          onEdit={() => { setEditItem(viewItem); setViewItem(null); }}
          onAdjust={() => { setAdjustItem(viewItem); setViewItem(null); }}
        />
      )}

      {/* Adjust stock */}
      {adjustItem && (
        <AdjustStockDialog
          item={adjustItem}
          branchId={branchId}
          onClose={() => setAdjustItem(null)}
        />
      )}

      {/* Archive confirmation */}
      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title={`Archive "${archiveTarget?.name}"?`}
        description="The item will be hidden from inventory and the POS. Stock movements are preserved. This can be reversed by support."
        confirmLabel="Archive item"
        destructive
        loading={archiveMutation.isPending}
        onConfirm={async () => {
          if (!archiveTarget) return;
          try {
            await archiveMutation.mutateAsync({ itemId: archiveTarget.id, archiveBranchId: branchId });
            toast.success(`"${archiveTarget.name}" archived`);
            setArchiveTarget(null);
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Could not archive item'));
          }
        }}
      />
    </>
  );
}

// ─── Item Form Dialog (Add + Edit) ────────────────────────────────────────────

function ItemFormDialog({
  open,
  branchId,
  item,
  onClose,
}: {
  open: boolean;
  branchId: string;
  item?: InventoryItem | null;
  onClose: () => void;
}) {
  const isEdit = !!item;

  const [name, setName] = React.useState(item?.name ?? '');
  const [unitPrice, setUnitPrice] = React.useState(Number(item?.unitPrice ?? 0));
  const [costPrice, setCostPrice] = React.useState(Number(item?.costPrice ?? 0));
  const [quantity, setQuantity] = React.useState(item?.quantity ?? 0);
  const [reorderLevel, setReorderLevel] = React.useState(item?.reorderLevel ?? 10);
  const [unitOfMeasure, setUnitOfMeasure] = React.useState(item?.unitOfMeasure ?? 'pcs');
  const [description, setDescription] = React.useState(item?.description ?? '');
  const [barcode, setBarcode] = React.useState(item?.barcode ?? '');
  const [categoryId, setCategoryId] = React.useState(item?.categoryId ?? item?.category?.id ?? '');
  const [storeId, setStoreId] = React.useState(item?.storeId ?? item?.store?.id ?? '');

  const { data: categoriesData } = useInventoryCategories({ limit: 100 });
  const categories = categoriesData?.data ?? [];
  const { data: storesData } = useInventoryStores({ limit: 100 });
  const stores = storesData?.data ?? [];

  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem(item?.id ?? '');

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Reset form when item changes (open different record)
  React.useEffect(() => {
    setName(item?.name ?? '');
    setUnitPrice(Number(item?.unitPrice ?? 0));
    setCostPrice(Number(item?.costPrice ?? 0));
    setQuantity(item?.quantity ?? 0);
    setReorderLevel(item?.reorderLevel ?? 10);
    setUnitOfMeasure(item?.unitOfMeasure ?? 'pcs');
    setDescription(item?.description ?? '');
    setBarcode(item?.barcode ?? '');
    setCategoryId(item?.categoryId ?? item?.category?.id ?? '');
    setStoreId(item?.storeId ?? item?.store?.id ?? '');
  }, [item]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('Item name is required'); return; }
    if (unitPrice <= 0) { toast.error('Selling price must be greater than zero'); return; }
    try {
      const payload = {
        branchId,
        name: name.trim(),
        unitPrice,
        costPrice: costPrice || undefined,
        reorderLevel,
        unitOfMeasure: unitOfMeasure || 'pcs',
        description: description || undefined,
        barcode: barcode || undefined,
        categoryId: categoryId || undefined,
        storeId: storeId || undefined,
        ...(!isEdit ? { quantity } : {}),
      };
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        toast.success(`"${name}" updated`);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(`"${name}" added to inventory`);
      }
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save item'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-600" />
            {isEdit ? `Edit — ${item?.name}` : 'Add Inventory Item'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update item details. To change stock quantity use Adjust Stock.'
              : 'New items get an auto-generated SKU. Opening stock is recorded as an opening balance movement.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 px-6 pb-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-sm">Item name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Air Filter ZH-1100" className="h-9 text-sm" />
          </div>

          {/* Pricing row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Selling price (KSh) <span className="text-destructive">*</span></Label>
              <Input type="number" min={0} step={0.01} value={unitPrice || ''}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                placeholder="0.00" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Cost price (KSh)</Label>
              <Input type="number" min={0} step={0.01} value={costPrice || ''}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                placeholder="0.00" className="h-9 text-sm" />
            </div>
          </div>

          {/* Opening qty + reorder (add only) */}
          {!isEdit && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Opening stock quantity</Label>
                <Input type="number" min={0} value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Reorder level</Label>
                <Input type="number" min={0} value={reorderLevel}
                  onChange={(e) => setReorderLevel(Number(e.target.value))}
                  className="h-9 text-sm" />
              </div>
            </div>
          )}

          {/* Reorder level for edit */}
          {isEdit && (
            <div className="space-y-1.5">
              <Label className="text-sm">Reorder level</Label>
              <Input type="number" min={0} value={reorderLevel}
                onChange={(e) => setReorderLevel(Number(e.target.value))}
                className="h-9 text-sm" />
            </div>
          )}

          {/* Category + Store */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Store / location</Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="No store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No store</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Unit of measure + barcode */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Unit of measure</Label>
              <Input value={unitOfMeasure} onChange={(e) => setUnitOfMeasure(e.target.value)}
                placeholder="pcs, kg, ltr…" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Barcode</Label>
              <Input value={barcode} onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or type barcode" className="h-9 text-sm" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-sm">Description</Label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional item description…" rows={2} maxLength={1000}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none" />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onClose}>Cancel</Button>
          <Button variant="brand" loading={isPending}
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}>
            {isEdit ? 'Save changes' : `Add item${unitPrice > 0 ? ` · ${formatKsh(unitPrice)}` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Item Detail Dialog ───────────────────────────────────────────────────────

function ItemDetailDialog({
  item,
  onClose,
  onEdit,
  onAdjust,
}: {
  item: InventoryItem;
  onClose: () => void;
  onEdit: () => void;
  onAdjust: () => void;
}) {
  const qty = item.quantity ?? 0;
  const reorder = item.reorderLevel ?? 10;
  const stockStatus =
    qty <= 0 ? 'Out of stock' : qty <= reorder ? 'Low stock' : 'In stock';
  const stockVariant =
    qty <= 0 ? 'destructive' : qty <= reorder ? 'warning' : 'success';

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-600" />
            {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-2">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <DetailRow label="SKU" value={<span className="font-mono text-xs">{item.sku}</span>} />
            <DetailRow label="Status" value={<Badge variant={stockVariant as 'success' | 'warning' | 'destructive'}>{stockStatus}</Badge>} />
            <DetailRow label="Sell price" value={formatKsh(item.unitPrice ?? 0)} />
            <DetailRow label="Cost price" value={Number(item.costPrice ?? 0) > 0 ? formatKsh(item.costPrice ?? 0) : '—'} />
            <DetailRow label="Qty on hand" value={<span className={cn('font-semibold tabular-nums', qty <= 0 ? 'text-destructive' : qty <= reorder ? 'text-warning-foreground' : 'text-success')}>{qty} {item.unitOfMeasure ?? 'pcs'}</span>} />
            <DetailRow label="Reorder level" value={`${reorder} ${item.unitOfMeasure ?? 'pcs'}`} />
            <DetailRow label="Category" value={item.category?.name ?? '—'} />
            <DetailRow label="Store" value={item.store?.name ?? '—'} />
            {item.barcode && <DetailRow label="Barcode" value={<span className="font-mono text-xs">{item.barcode}</span>} />}
          </div>
          {item.description && (
            <p className="rounded-md border border-border bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
              {item.description}
            </p>
          )}
          {qty <= reorder && (
            <div className={cn(
              'flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm',
              qty <= 0
                ? 'border-destructive/30 bg-destructive/5 text-destructive'
                : 'border-warning/30 bg-warning/5 text-warning-foreground',
            )}>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{qty <= 0 ? 'Out of stock — restock required.' : `Low stock alert — only ${qty} left (reorder at ${reorder}).`}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" size="sm" leftIcon={<ArrowUpDown className="h-3.5 w-3.5" />} onClick={onAdjust}>
            Adjust Stock
          </Button>
          <Button variant="brand" size="sm" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={onEdit}>
            Edit item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}

// ─── Adjust Stock Dialog ──────────────────────────────────────────────────────

function AdjustStockDialog({
  item,
  branchId,
  onClose,
}: {
  item: InventoryItem;
  branchId: string;
  onClose: () => void;
}) {
  const [movementType, setMovementType] = React.useState<StockMovementType>('ADJUSTMENT');
  const [delta, setDelta] = React.useState<number>(0);
  const [reason, setReason] = React.useState('');
  const [unitCost, setUnitCost] = React.useState<number>(0);

  const adjustMutation = useAdjustStock(item.id);
  const currentQty = item.quantity ?? 0;
  const isPositive = delta > 0;
  const projectedQty = currentQty + delta;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (delta === 0) { toast.error('Quantity change cannot be zero'); return; }
    if (projectedQty < 0) { toast.error('Adjustment would take stock below zero'); return; }
    try {
      await adjustMutation.mutateAsync({
        branchId,
        quantityDelta: delta,
        type: movementType,
        reason: reason || undefined,
        unitCost: unitCost > 0 ? unitCost : undefined,
      });
      toast.success(`Stock adjusted — new balance: ${projectedQty}`);
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not adjust stock'));
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-brand-600" />
            Adjust Stock — {item.name}
          </DialogTitle>
          <DialogDescription>
            Current stock: <strong>{currentQty} {item.unitOfMeasure ?? 'pcs'}</strong>
            {item.sku && <> · SKU: <span className="font-mono">{item.sku}</span></>}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 pb-2">
          {/* Movement type */}
          <div className="space-y-1.5">
            <Label className="text-sm">Movement type <span className="text-destructive">*</span></Label>
            <Select value={movementType}
              onValueChange={(v) => setMovementType(v as StockMovementType)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STOCK_MOVEMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{STOCK_MOVEMENT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Delta — sign toggle + absolute value */}
          <div className="space-y-1.5">
            <Label className="text-sm">Quantity change <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              <div className="flex rounded-md border border-border overflow-hidden">
                <button type="button"
                  onClick={() => setDelta((d) => Math.abs(d) * -1)}
                  className={cn('px-3 py-2 text-xs font-semibold transition-colors',
                    delta <= 0 ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground hover:bg-accent')}>
                  − Remove
                </button>
                <button type="button"
                  onClick={() => setDelta((d) => Math.abs(d))}
                  className={cn('px-3 py-2 text-xs font-semibold transition-colors',
                    delta >= 0 ? 'bg-success/10 text-success' : 'text-muted-foreground hover:bg-accent')}>
                  + Add
                </button>
              </div>
              <Input type="number" min={1} value={Math.abs(delta) || ''}
                onChange={(e) => {
                  const abs = Math.max(0, Number(e.target.value));
                  setDelta(delta < 0 ? -abs : abs);
                }}
                placeholder="Quantity" className="h-9 flex-1 text-sm" />
            </div>
          </div>

          {/* Unit cost (for purchases) */}
          {(movementType === 'PURCHASE') && (
            <div className="space-y-1.5">
              <Label className="text-sm">Unit cost (KSh)</Label>
              <Input type="number" min={0} step={0.01} value={unitCost || ''}
                onChange={(e) => setUnitCost(Number(e.target.value))}
                placeholder="0.00" className="h-9 text-sm" />
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label className="text-sm">Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Stock count correction, received from supplier…"
              className="h-9 text-sm" maxLength={500} />
          </div>

          {/* Preview */}
          {delta !== 0 && (
            <div className={cn(
              'rounded-lg border p-3 text-sm space-y-1.5',
              projectedQty < 0
                ? 'border-destructive/30 bg-destructive/5'
                : 'border-border bg-muted/20',
            )}>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current stock</span>
                <span className="tabular-nums font-medium">{currentQty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Change</span>
                <span className={cn('tabular-nums font-semibold',
                  isPositive ? 'text-success' : 'text-destructive')}>
                  {isPositive ? '+' : ''}{delta}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
                <span>New balance</span>
                <span className={cn('tabular-nums',
                  projectedQty < 0 ? 'text-destructive' : projectedQty === 0 ? 'text-warning-foreground' : 'text-success')}>
                  {projectedQty}
                </span>
              </div>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={adjustMutation.isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="brand" loading={adjustMutation.isPending}
            disabled={delta === 0 || projectedQty < 0}
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}>
            Apply adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
