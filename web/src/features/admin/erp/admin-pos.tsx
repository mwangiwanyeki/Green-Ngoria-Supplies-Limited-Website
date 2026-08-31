'use client';

import { useMemo, useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/page-header';
import { formatKsh } from '@/components/admin/erp-list-shell';
import {
  useInventoryItems,
  type InventoryItem,
} from '@/lib/api/hooks/use-inventory';

interface CartLine {
  itemId: string;
  name: string;
  price: number;
  qty: number;
}

export function AdminPos() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const query = useInventoryItems({ search, page: 1, limit: 60 });

  const items = query.data?.data ?? [];
  const total = useMemo(
    () => cart.reduce((s, l) => s + l.price * l.qty, 0),
    [cart],
  );

  const add = (i: InventoryItem) => {
    const price = Number(i.unitPrice ?? 0);
    setCart((c) => {
      const existing = c.find((l) => l.itemId === i.id);
      if (existing) {
        return c.map((l) =>
          l.itemId === i.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [...c, { itemId: i.id, name: i.name, price, qty: 1 }];
    });
  };
  const bump = (id: string, delta: number) =>
    setCart((c) =>
      c
        .map((l) => (l.itemId === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  const remove = (id: string) =>
    setCart((c) => c.filter((l) => l.itemId !== id));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Point of Sale"
        description="Ring up sales for the active branch."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
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
              No products found.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {items.map((i) => (
                <button
                  key={i.id}
                  onClick={() => add(i)}
                  className="rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-brand-500 hover:bg-brand-500/5"
                >
                  <div className="line-clamp-2 min-h-[2.5em] text-sm font-medium">
                    {i.name}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-semibold text-brand-600 dark:text-brand-400">
                      {formatKsh(i.unitPrice ?? 0)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {i.quantity ?? 0} pcs
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-xl border border-border bg-card p-4 lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <ShoppingCart className="h-4 w-4" />
            <h2 className="font-semibold">Cart</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {cart.length} items
            </span>
          </div>
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Add products to start a sale.
            </p>
          ) : (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto py-3">
              {cart.map((l) => (
                <li
                  key={l.itemId}
                  className="rounded-md border border-border p-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{l.name}</span>
                    <button
                      onClick={() => remove(l.itemId)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-md border border-border">
                      <button
                        onClick={() => bump(l.itemId, -1)}
                        className="px-2 py-1 hover:bg-accent"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[28px] text-center text-sm tabular-nums">
                        {l.qty}
                      </span>
                      <button
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
            >
              Charge {formatKsh(total)}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
