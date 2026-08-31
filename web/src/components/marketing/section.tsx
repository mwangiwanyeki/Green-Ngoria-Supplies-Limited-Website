import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'sunken' | 'ink';

const TONE: Record<Tone, string> = {
  default: 'bg-background text-foreground',
  sunken: 'bg-surface-sunken text-foreground',
  ink: 'surface-ink on-ink',
};

/**
 * Page section shell. Vertical rhythm is generous between sections and
 * tight within them, per the project spacing rule.
 */
export function Section({
  children,
  className,
  tone = 'default',
  rule = false,
  id,
  labelledBy,
  width = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
  /** Draw a hairline across the top edge. */
  rule?: boolean;
  id?: string;
  labelledBy?: string;
  width?: 'default' | 'wide' | 'prose';
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        'relative py-20 sm:py-24 lg:py-32',
        TONE[tone],
        rule && 'border-t border-hairline',
        className,
      )}
    >
      <div
        className={cn(
          'relative mx-auto px-5 sm:px-8 lg:px-10',
          width === 'wide' && 'max-w-[88rem]',
          width === 'default' && 'max-w-7xl',
          width === 'prose' && 'max-w-3xl',
        )}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * Section heading block. There is deliberately no eyebrow/kicker slot —
 * the heading carries the weight.
 */
export function SectionIntro({
  id,
  title,
  lead,
  action,
  align = 'split',
  level = 2,
  onInk = false,
  className,
}: {
  id?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  action?: React.ReactNode;
  align?: 'split' | 'stack';
  level?: 2 | 3;
  onInk?: boolean;
  className?: string;
}) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <div
      className={cn(
        align === 'split'
          ? 'flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16'
          : 'flex flex-col gap-6',
        className,
      )}
    >
      <div className="max-w-3xl">
        <Heading
          id={id}
          className={cn(
            'font-display font-bold',
            level === 2 ? 'text-display-lg' : 'text-display-md',
            onInk ? 'text-[hsl(var(--on-ink))]' : 'text-foreground',
          )}
        >
          {title}
        </Heading>
        {lead && (
          <div
            className={cn(
              'measure mt-6 text-base leading-7 sm:text-[1.0625rem] sm:leading-8',
              onInk
                ? 'text-[hsl(var(--on-ink-muted))]'
                : 'text-muted-foreground',
            )}
          >
            {lead}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
