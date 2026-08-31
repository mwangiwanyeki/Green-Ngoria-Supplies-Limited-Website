import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SpecRow {
  term: string;
  value: React.ReactNode;
  /** Render the value in the mono face — reference numbers, identifiers. */
  mono?: boolean;
}

/**
 * EquipmentSpecPanel / technical datasheet. A hairline definition table used
 * wherever the page is presenting recorded facts rather than prose: company
 * registration, plant approvals, division datasheets.
 */
export function SpecPanel({
  title,
  caption,
  rows,
  footnote,
  tone = 'card',
  className,
}: {
  title?: string;
  caption?: string;
  rows: SpecRow[];
  footnote?: React.ReactNode;
  tone?: 'card' | 'plain' | 'accent';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl',
        tone === 'card' && 'border border-border bg-card p-6 shadow-low sm:p-8',
        tone === 'accent' &&
          'border border-brand-500/25 bg-accent/60 p-6 shadow-low sm:p-8',
        className,
      )}
    >
      {title && (
        <h3 className="font-display text-lg font-bold tracking-tight">
          {title}
        </h3>
      )}
      {caption && (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {caption}
        </p>
      )}

      <dl
        className={cn(
          'divide-y divide-hairline border-hairline',
          (title || caption) && 'mt-6 border-t',
          !title && !caption && 'border-y',
        )}
      >
        {rows.map((row) => (
          <div
            key={row.term}
            className="grid gap-1 py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6"
          >
            <dt className="tech-label pt-0.5">{row.term}</dt>
            <dd
              className={cn(
                'text-sm leading-6',
                row.mono
                  ? 'font-mono text-foreground'
                  : 'font-medium text-foreground',
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {footnote && (
        <p className="mt-5 text-xs leading-5 text-subtle">{footnote}</p>
      )}
    </div>
  );
}

/**
 * Scope register — a dense two-column technical list. Used instead of a bullet
 * list wherever the profile supplies an enumerated scope of work.
 */
export function ScopeRegister({
  items,
  columns = 2,
  className,
}: {
  items: readonly string[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        'grid border-t border-hairline',
        columns === 2 && 'sm:grid-cols-2 sm:gap-x-10',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-10',
        className,
      )}
    >
      {items.map((item, index) => (
        <li
          key={item}
          className="flex items-baseline gap-4 border-b border-hairline py-3.5"
        >
          <span
            aria-hidden="true"
            className="font-mono text-[0.6875rem] text-subtle"
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-sm leading-6">{item}</span>
        </li>
      ))}
    </ul>
  );
}
