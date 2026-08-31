'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FilterChip {
  key: string;
  label: string;
  count?: number;
}

export function FilterChips({
  chips,
  value,
  onChange,
  className,
}: {
  chips: FilterChip[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {chips.map((c) => {
        const active = value === c.key;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              active
                ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                : 'border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
            aria-pressed={active}
          >
            {c.label}
            {typeof c.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                  active
                    ? 'bg-brand-500/20 text-brand-700 dark:text-brand-300'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {c.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ListSearchBar({
  value,
  onChange,
  placeholder,
  right,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div className="flex-1 min-w-[220px] max-w-md">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          placeholder={placeholder ?? 'Search…'}
          className="h-9 bg-muted/30"
        />
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  perPage,
  onPerPageChange,
  perPageOptions = [10, 15, 25, 50, 100],
  total,
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  perPage: number;
  onPerPageChange: (n: number) => void;
  perPageOptions?: number[];
  total: number;
  className?: string;
}) {
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  const pageNums = pageWindow(page, pageCount);
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span>
          Showing {start}-{end} of {total}
        </span>
        <label className="flex items-center gap-2">
          Rows per page:
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="h-7 rounded-md border border-border bg-background px-2 text-xs"
          >
            {perPageOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Prev
        </Button>
        {pageNums.map((n, i) =>
          n === '…' ? (
            <span key={`gap-${i}`} className="px-1">
              …
            </span>
          ) : (
            <Button
              key={n}
              size="sm"
              variant={n === page ? 'brand' : 'outline'}
              onClick={() => onPageChange(n as number)}
              className="min-w-[32px]"
            >
              {n}
            </Button>
          ),
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.min(pageCount || 1, page + 1))}
          disabled={page >= (pageCount || 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function pageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 1) return [1];
  const around = 1;
  const set = new Set<number>([1, total, current]);
  for (let i = 1; i <= around; i++) {
    if (current - i > 1) set.add(current - i);
    if (current + i < total) set.add(current + i);
  }
  const nums = [...set].sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  for (let i = 0; i < nums.length; i++) {
    out.push(nums[i]);
    if (i < nums.length - 1 && nums[i + 1] - nums[i] > 1) out.push('…');
  }
  return out;
}

export function KpiRow({
  items,
  className,
}: {
  items: {
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    icon?: React.ReactNode;
    accent?: 'brand' | 'success' | 'warning' | 'destructive' | 'default';
  }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {items.map((it, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {it.label}
            </p>
            {it.icon && (
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md',
                  it.accent === 'success' && 'bg-success/15 text-success',
                  it.accent === 'warning' &&
                    'bg-warning/15 text-warning-foreground',
                  it.accent === 'destructive' &&
                    'bg-destructive/15 text-destructive',
                  (!it.accent || it.accent === 'brand') &&
                    'bg-brand-500/10 text-brand-600 dark:text-brand-400',
                  it.accent === 'default' && 'bg-muted text-foreground',
                )}
              >
                {it.icon}
              </div>
            )}
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight">
            {it.value}
          </div>
          {it.sub && (
            <div className="mt-1 text-xs text-muted-foreground">{it.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// KES currency formatter
export function formatKsh(
  value: number | string | null | undefined,
  opts: { compact?: boolean } = {},
): string {
  const n = typeof value === 'string' ? Number(value) : (value ?? 0);
  if (!Number.isFinite(n)) return 'KSh 0';
  const nf = new Intl.NumberFormat('en-KE', {
    notation: opts.compact ? 'compact' : 'standard',
    maximumFractionDigits: opts.compact ? 1 : 0,
  });
  return `KSh ${nf.format(n)}`;
}
