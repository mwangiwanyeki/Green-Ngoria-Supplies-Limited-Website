import Link from 'next/link';
import { company } from '@/config/company';

/**
 * Credibility strip (DESIGN.md §5.2). Every entry is a verifiable record from
 * the company profile — a registration, a standard or a statutory approval.
 * Identifiers are set in the mono face because they are literal reference
 * numbers, and figures use tabular numerals.
 */
export function TrustStrip() {
  const records: { term: string; value: string; mono?: boolean }[] = [
    {
      term: 'Incorporated',
      value: company.registration.incorporated,
    },
    {
      term: 'Company number',
      value: company.registration.companyNumber,
      mono: true,
    },
    { term: 'KRA PIN', value: company.registration.kraPin, mono: true },
    {
      term: 'Plant approval',
      value: 'NEMA/PR/SYA/002',
      mono: true,
    },
  ];

  return (
    <section
      aria-label="Registration and certification record"
      className="border-y border-hairline bg-surface-sunken"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-y-10 py-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-x-16 lg:py-12">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-4">
            {records.map((record) => (
              <div key={record.term}>
                <dt className="tech-label">{record.term}</dt>
                <dd
                  className={
                    record.mono
                      ? 'mt-2 font-mono text-sm text-foreground'
                      : 'mt-2 text-sm font-medium tabular-figures text-foreground'
                  }
                >
                  {record.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="lg:border-l lg:border-hairline lg:pl-16">
            <h2 className="tech-label">Certified to</h2>
            <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              {company.certifications.map((certification) => (
                <li
                  key={certification.name}
                  className="font-display text-sm font-bold tracking-tight text-foreground"
                >
                  {certification.name}
                  <span className="mt-0.5 block text-[0.6875rem] font-medium tracking-normal text-muted-foreground">
                    {certification.scope}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/certifications"
              className="mt-5 inline-block text-sm font-semibold text-brand-600 underline decoration-brand-600/30 underline-offset-4 transition-colors hover:decoration-brand-600 dark:text-brand-400 dark:decoration-brand-400/30 dark:hover:decoration-brand-400"
            >
              See the full compliance record
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
