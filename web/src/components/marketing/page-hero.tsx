import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroAction {
  label: string;
  href: string;
}

export interface HeroFact {
  term: string;
  value: string;
}

interface PageHeroProps {
  title: React.ReactNode;
  /** One or two short paragraphs of standfirst copy. */
  lead?: string | string[];
  primaryAction?: HeroAction;
  secondaryAction?: HeroAction;
  /** A hairline ledger of verifiable facts, rendered under the actions. */
  facts?: HeroFact[];
  className?: string;
}

/**
 * The dark editorial hero at the top of every public content page.
 * The surface is fixed-dark in both themes; text colours come from the
 * `--on-ink` token ramp so contrast holds regardless of theme.
 *
 * There is no eyebrow slot by design — the heading carries the page.
 */
export function PageHero({
  title,
  lead,
  primaryAction,
  secondaryAction,
  facts,
  className,
}: PageHeroProps) {
  const paragraphs = lead ? (Array.isArray(lead) ? lead : [lead]) : [];

  return (
    <section
      className={cn(
        'surface-ink on-ink texture-grain relative overflow-hidden',
        className,
      )}
    >
      <div className="linework pointer-events-none absolute inset-0 opacity-60" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-48 h-[34rem] w-[34rem] rounded-full bg-brand-500/[0.13] blur-[130px]"
      />

      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-36 sm:px-8 sm:pb-24 sm:pt-40 lg:px-10 lg:pb-28 lg:pt-44">
        <h1 className="max-w-[20ch] font-display text-display-xl font-extrabold text-[hsl(var(--on-ink))]">
          {title}
        </h1>

        {paragraphs.length > 0 && (
          <div className="measure mt-7 space-y-4">
            {paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-[1.0625rem] leading-8 text-[hsl(var(--on-ink-muted))]"
              >
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {(primaryAction || secondaryAction) && (
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            {primaryAction && (
              <Link href={primaryAction.href}>
                <Button
                  variant="brand"
                  size="lg"
                  className="w-full sm:w-auto"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {primaryAction.label}
                </Button>
              </Link>
            )}
            {secondaryAction && (
              <Link href={secondaryAction.href}>
                <Button variant="on-ink" size="lg" className="w-full sm:w-auto">
                  {secondaryAction.label}
                </Button>
              </Link>
            )}
          </div>
        )}

        {facts && facts.length > 0 && (
          <dl className="mt-16 grid gap-x-10 gap-y-7 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.term}>
                <dt className="tech-label text-[hsl(var(--on-ink-subtle))]">
                  {fact.term}
                </dt>
                <dd className="mt-2 text-sm font-medium leading-6 text-[hsl(var(--on-ink))]">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
