import { company } from '@/config/company';
import { Reveal, RevealItem } from '@/components/marketing/reveal';
import { cn } from '@/lib/utils';

/**
 * East African reach (DESIGN.md §5.11) as a hairline register of operating
 * countries, each carrying the role the profile records for it.
 */
export function RegionalReach({ className }: { className?: string }) {
  return (
    <Reveal
      kind="draw"
      as="dl"
      className={cn(
        'grid border-t border-hairline sm:grid-cols-2 lg:grid-cols-5 lg:border-t-0',
        className,
      )}
    >
      {company.regions.map((region) => (
        <RevealItem
          key={region.name}
          className="border-b border-hairline py-6 lg:border-b-0 lg:border-t lg:pr-6 lg:pt-7"
        >
          <dt className="font-display text-xl font-bold tracking-tight">
            {region.name}
          </dt>
          <dd className="mt-2 text-sm leading-6 text-muted-foreground">
            {region.note}
          </dd>
        </RevealItem>
      ))}
    </Reveal>
  );
}
