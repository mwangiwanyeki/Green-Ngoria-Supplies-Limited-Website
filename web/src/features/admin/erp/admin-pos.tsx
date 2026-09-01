'use client';

import { useMemo, useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/page-header';
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
import { formatKsh } from '@/components/admin/erp-list-shell';
import {
  useInventoryItems,
  type InventoryItem,
} from '@/lib/api/hooks/use-inventory';
import {
  useCreateSale,
  PAYMENT_METHODS,
  type PaymentMethod,
  type SaleChannel,
} from '@/lib/api/hooks/use-sales';
import { useBranchStore } from '@/stores/branch-store';
import { getApiErrorMessage } from '@/lib/api/api-error';

import { useErpCustomers as useCustomers } from '@/lib/api/hooks/use-erp-customers';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  MPESA: 'M-Pesa',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  CREDIT: 'Credit',
};

interface CartLine {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  sku?: string;
}

interface PaymentLine {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference: string;
}

export function AdminPos() {
  const branchId = useBranchStore((s) => s.activeBranchId) ?? '';
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const query = useInventoryItems({ search, page: 1, limit: 60 });
  const items = query.data?.data ?? [];

  const total = useMemo(
    () => cart.reduce((s, l) => s + l.price * l.qty, 0),
    [cart],
  );

  function add(i: InventoryItem) {
    const price = Number(i.unitPrice ?? 0);
    setCart((c) => {
      const existing = c.find((l) => l.itemId === i.id);
      if (existing) {
        return c.map((l) => (l.itemId === i.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...c, { itemId: i.id, name: i.name, price, qty: 1, sku: i.sku }];
    });
  }

  function bump(id: string, delta: number) {
    setCart((c) =>
      c
        .map((l) => (l.itemId === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  }

  function remove(id: string) {
    setCart((c) => c.filter((l) => l.itemId !== id));
  }

  function clearCart() {
    setCart([]);
    setShowCheckout(false);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Point of Sale"
        description="Ring up sales for the active branch."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Product grid */}
        <div className="space-y-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Search products…"
          />
          {query.isLoading ? (
            <PageSkeleton />
          ) : query.isError ? (
            <ErrorState retry={() => void query.refetch()} />
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              {search ? 'No products match your search.' : 'No products in inventory yet.'}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {items.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => add(i)}
                  disabled={(i.quantity ?? 0) <= 0}
                  className="rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-brand-500 hover:bg-brand-500/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="line-clamp-2 min-h-[2.5em] text-sm font-medium">
                    {i.name}
                  </div>
                  {i.sku && (
                    <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {i.sku}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-semibold text-brand-600 dark:text-brand-400">
                      {formatKsh(i.unitPrice ?? 0)}
                    </span>
                    <span
                      className={
                        (i.quantity ?? 0) <= 0
                          ? 'text-xs text-destructive'
                          : 'text-xs text-muted-foreground'
                      }
                    >
                      {i.quantity ?? 0} pcs
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart sidebar */}
        <aside className="rounded-xl border border-border bg-card p-4 lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <ShoppingCart className="h-4 w-4" />
            <h2 className="font-semibold">Cart</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </span>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-muted-foreground hover:text-destructive"
                title="Clear cart"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Tap a product to add it to the cart.
            </p>
          ) : (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto py-3">
              {cart.map((l) => (
                <li key={l.itemId} className="rounded-md border border-border p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-medium">{l.name}</span>
                      {l.sku && (
                        <span className="font-mono text-[10px] text-muted-foreground">{l.sku}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(l.itemId)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-md border border-border">
                      <button
                        type="button"
                        onClick={() => bump(l.itemId, -1)}
                        className="px-2 py-1 hover:bg-accent"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[28px] text-center text-sm tabular-nums">
                        {l.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => bump(l.itemId, 1)}
                        className="px-2 py-1 hover:bg-accent"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatKsh(l.price * l.qty)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 space-y-3 border-t border-border pt-3">
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums text-brand-600 dark:text-brand-400">
                {formatKsh(total)}
              </span>
            </div>
            <Button
              variant="brand"
              className="w-full"
              disabled={cart.length === 0}
              leftIcon={<CreditCard className="h-4 w-4" />}
              onClick={() => setShowCheckout(true)}
            >
              Charge {formatKsh(total)}
            </Button>
          </div>
        </aside>
      </div>

      {/* Checkout dialog */}
      {showCheckout && (
        <CheckoutDialog
          cart={cart}
          total={total}
          branchId={branchId}
          onSuccess={clearCart}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}

// ─── Checkout Dialog ──────────────────────────────────────────────────────────

function CheckoutDialog({
  cart,
  total,
  branchId,
  onSuccess,
  onClose,
}: {
  cart: CartLine[];
  total: number;
  branchId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [customerId, setCustomerId] = useState('');
  const [channel, setChannel] = useState<SaleChannel>('POS');
  const [payments, setPayments] = useState<PaymentLine[]>([
    { id: crypto.randomUUID(), method: 'CASH', amount: total, reference: '' },
  ]);

  const createSale = useCreateSale();
  const { data: customersData } = useCustomers({ limit: 100 });
  const customers = customersData?.data ?? [];

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const amountDue = Math.max(0, total - totalPaid);
  const change = Math.max(0, totalPaid - total);

  function addPayment() {
    setPayments((p) => [
      ...p,
      { id: crypto.randomUUID(), method: 'CASH', amount: Math.max(0, amountDue), reference: '' },
    ]);
  }

  function updatePayment(id: string, patch: Partial<PaymentLine>) {
    setPayments((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function removePayment(id: string) {
    setPayments((p) => p.filter((x) => x.id !== id));
  }

  async function handleCharge() {
    if (amountDue > 0 && !customerId) {
      toast.error('Select a customer for credit sales');
      return;
    }
    try {
      await createSale.mutateAsync({
        branchId,
        customerId: customerId || undefined,
        channel,
        items: cart.map((l) => ({
          itemId: l.itemId,
          name: l.name,
          quantity: l.qty,
          unitPrice: l.price,
        })),
        payments: payments
          .filter((p) => p.amount > 0)
          .map((p) => ({
            method: p.method,
            amount: p.amount,
            reference: p.reference || undefined,
          })),
      });
      toast.success('Sale recorded');
      onSuccess();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not process sale'));
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-brand-600" />
            Checkout — {formatKsh(total)}
          </DialogTitle>
          <DialogDescription>
            {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-2">
          {/* Customer (optional for cash, required for credit) */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Customer{' '}
              <span className="text-xs text-muted-foreground font-normal">
                (required for credit sales)
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
                    {c.name}{c.phone ? ` · ${c.phone}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Payments</Label>
              <Button type="button" size="sm" variant="outline"
                leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={addPayment}>
                Split
              </Button>
            </div>
            {payments.map((p) => (
              <div key={p.id} className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
                <Select value={p.method}
                  onValueChange={(v) => updatePayment(p.id, { method: v as PaymentMethod })}>
                  <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" min={0} step={0.01} value={p.amount || ''}
                  onChange={(e) => updatePayment(p.id, { amount: Number(e.target.value) })}
                  className="h-8 text-sm" placeholder="Amount" />
                {payments.length > 1 && (
                  <button type="button" onClick={() => removePayment(p.id)}
                    className="text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold tabular-nums">{formatKsh(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tendered</span>
              <span className="tabular-nums text-success">{formatKsh(totalPaid)}</span>
            </div>
            {amountDue > 0 && (
              <div className="flex justify-between font-semibold text-warning-foreground">
                <span>Balance due</span>
                <span className="tabular-nums">{formatKsh(amountDue)}</span>
              </div>
            )}
            {change > 0 && (
              <div className="flex justify-between font-semibold text-success border-t border-border pt-2">
                <span>Change</span>
                <span className="tabular-nums">{formatKsh(change)}</span>
              </div>
            )}
          </div>

          {amountDue > 0 && !customerId && (
            <p className="text-xs text-warning-foreground flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5 shrink-0" />
              Select a customer to save this as a credit sale.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={createSale.isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="brand" loading={createSale.isPending}
            disabled={amountDue > 0 && !customerId}
            onClick={() => void handleCharge()}>
            Confirm · {formatKsh(total)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
