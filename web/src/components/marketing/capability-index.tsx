import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ServiceIcon } from '@/components/marketing/service-icon';
import { Reveal, RevealItem } from '@/components/marketing/reveal';
import { serviceDivisions } from '@/config/services';
import { cn } from '@/lib/utils';

export interface CapabilityGroup {
  heading: string;
  note: string;
  slugs: string[];
}

/**
 * The division index, rendered as a technical register rather than a grid of
 * identical cards: a sticky group label on the left, hairline-separated
 * division rows on the right, each row carrying its own scope count.
 */
export function CapabilityIndex({
  groups,
  className,
}: {
  groups: CapabilityGroup[];
  className?: string;
}) {
  return (
    <div className={cn('space-y-16 lg:space-y-20', className)}>
      {groups.map((group) => (
        <div
          key={group.heading}
          className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16"
        >
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h3 className="font-display text-lg font-bold tracking-tight">
              {group.heading}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {group.note}
            </p>
          </div>

          <Reveal kind="draw" as="ul" className="border-t border-hairline">
            {group.slugs.map((slug) => {
              const division = serviceDivisions.find((d) => d.slug === slug);
              if (!division) return null;
              return (
                <RevealItem
                  key={division.slug}
                  as="li"
                  className="border-b border-hairline"
                >
                  <Link
                    href={`/services/${division.slug}`}
                    className="group flex items-start gap-5 py-6 transition-colors duration-ui ease-out-expo hover:bg-accent/50 focus-visible:bg-accent/50 sm:gap-7 sm:px-4 sm:-mx-4"
                  >
                    <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-hairline bg-card text-muted-foreground shadow-low transition-[border-color,color,transform] duration-ui ease-out-expo group-hover:-translate-y-0.5 group-hover:border-brand-500/45 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                      <ServiceIcon name={division.icon} className="h-5 w-5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-display text-lg font-semibold tracking-tight">
                          {division.name}
                        </span>
                        <span className="font-mono text-xs text-subtle">
                          {String(division.scope.length).padStart(2, '0')} scope
                          items
                        </span>
                      </span>
                      <span className="measure mt-2 block text-sm leading-6 text-muted-foreground">
                        {division.summary}
                      </span>
                    </span>

                    <ArrowUpRight
                      aria-hidden="true"
                      className="mt-1 h-5 w-5 shrink-0 text-subtle transition-[transform,color] duration-ui ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400"
                    />
                  </Link>
                </RevealItem>
              );
            })}
          </Reveal>
        </div>
      ))}
    </div>
  );
}

/** The grouping used by the profile itself. */
export const capabilityGroups: CapabilityGroup[] = [
  {
    heading: 'Mining',
    note: 'The discipline the company was built around, with operating sites in Kenya and Tanzania.',
    slugs: ['gold-mining', 'gemstone-mining'],
  },
  {
    heading: 'Construction & civil works',
    note: 'Buildings, roads and water infrastructure delivered by qualified engineers and site staff.',
    slugs: ['building-works', 'road-construction', 'water-projects'],
  },
  {
    heading: 'Engineering',
    note: 'Mechanical and electrical scope, including specialised erection in the oil and power sectors.',
    slugs: ['mechanical', 'electrical-services'],
  },
  {
    heading: 'Importation & supply',
    note: 'Petroleum products, timber and general merchandise imported and supplied across the region.',
    slugs: ['oil-and-petroleum', 'timber-importation', 'general-supplies'],
  },
];
