import * as React from 'react';
import { slugify } from '@/lib/utils';
import { Section } from '@/components/marketing/section';

export interface LegalSection {
  heading: string;
  body: string[];
}

/**
 * Legal document layout: a sticky clause index beside numbered clauses.
 * Numbering is retained here because a legal document's clause order is
 * itself referenceable information.
 */
export function LegalDocument({
  sections,
  footer,
}: {
  sections: LegalSection[];
  footer?: React.ReactNode;
}) {
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-20">
        <nav
          aria-label="Contents"
          className="lg:sticky lg:top-28 lg:self-start"
        >
          <h2 className="tech-label border-b border-hairline pb-3">Contents</h2>
          <ol className="mt-4 space-y-2.5">
            {sections.map((section, index) => (
              <li key={section.heading} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="font-mono text-[0.6875rem] leading-6 text-subtle"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <a
                  href={`#${slugify(section.heading)}`}
                  className="text-sm leading-6 text-muted-foreground underline decoration-transparent underline-offset-4 transition-colors hover:text-foreground hover:decoration-border"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-2xl">
          <div className="divide-y divide-hairline">
            {sections.map((section, index) => (
              <section
                key={section.heading}
                id={slugify(section.heading)}
                className="py-10 first:pt-0"
              >
                <div className="flex items-baseline gap-4">
                  <span
                    aria-hidden="true"
                    className="font-mono text-xs text-subtle"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2 className="font-display text-xl font-bold tracking-tight">
                    {section.heading}
                  </h2>
                </div>
                <div className="mt-4 space-y-4 pl-0 sm:pl-8">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="measure text-[0.9375rem] leading-7 text-muted-foreground"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {footer && (
            <div className="mt-12 rounded-xl border border-border bg-card p-7 shadow-low">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
