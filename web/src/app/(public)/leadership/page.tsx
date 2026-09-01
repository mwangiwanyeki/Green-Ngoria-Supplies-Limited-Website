import type { Metadata } from 'next';
import Image from 'next/image';
import { Mail, Phone } from 'lucide-react';
import { PageHero } from '@/components/marketing/page-hero';
import { Section, SectionIntro } from '@/components/marketing/section';
import { Reveal, RevealItem } from '@/components/marketing/reveal';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { company } from '@/config/company';

const title = 'Leadership';
const description =
  'The chairperson, managing director, legal officer and production manager who direct Green Ngoria Supplies Limited.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} | ${company.legalName}`,
    description,
    type: 'website',
    url: '/leadership',
  },
};

/** Monogram used in place of a portrait — the profile supplies no photographs. */
function monogram(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}

export default function LeadershipPage() {
  const chair = company.leadership[0];

  return (
    <>
      <PageHero
        title="The people directing Green Ngoria"
        lead={[
          'Green Ngoria is directed by a small leadership team covering governance, commercial management, legal and compliance, and production at the operating sites.',
          'Every technical department below them is headed by a qualified engineer, supported by qualified staff for project construction, project supervision and supplies.',
        ]}
        primaryAction={{ label: 'Contact the office', href: '/contact' }}
        secondaryAction={{ label: 'About the company', href: '/about' }}
        facts={[
          { term: 'Named directors', value: String(company.leadership.length) },
          { term: 'Head office', value: 'Nairobi, Kenya' },
          { term: 'Regional contact', value: 'Uganda' },
          {
            term: 'Technical departments',
            value: 'Each headed by a qualified engineer',
          },
        ]}
      />

      <Section labelledBy="team-heading">
        <SectionIntro
          id="team-heading"
          title="Direct lines into the company"
          lead={`General enquiries are handled from the head office at ${company.contact.addressOneLine}. Directors can also be reached on the numbers listed against each profile.`}
          align="stack"
        />

        <Reveal
          kind="draw"
          as="ol"
          className="mt-14 divide-y divide-hairline border-y border-hairline"
        >
          {company.leadership.map((person) => (
            <RevealItem key={person.name} as="li">
              <article className="grid gap-6 py-10 lg:grid-cols-[auto_minmax(0,1fr)_16rem] lg:gap-12 items-start">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-hairline bg-muted shadow-card">
                  {person.image ? (
                    <Image
                      src={person.image}
                      alt={person.name}
                      fill
                      unoptimized
                      priority
                      className="object-cover object-top"
                      sizes="112px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-display text-lg font-bold text-brand-700 dark:text-brand-400">
                      {monogram((person as { name: string }).name)}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-display text-xl font-bold tracking-tight">
                    {person.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-400">
                    {person.role}
                  </p>
                  {'shares' in person && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      Shareholding: {person.shares}
                    </p>
                  )}
                  <p className="measure mt-4 text-[0.9375rem] leading-7 text-muted-foreground">
                    {person.responsibilities}
                  </p>
                </div>

                <dl className="space-y-3 lg:border-l lg:border-hairline lg:pl-8">
                  {person.email && (
                    <div>
                      <dt className="tech-label">Email</dt>
                      <dd className="mt-1.5">
                        <a
                          href={`mailto:${person.email}`}
                          className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Mail
                            className="h-4 w-4 shrink-0 text-subtle"
                            aria-hidden="true"
                          />
                          <span className="underline decoration-border underline-offset-4 transition-colors group-hover:decoration-foreground">
                            {person.email}
                          </span>
                        </a>
                      </dd>
                    </div>
                  )}
                  {person.phone && (
                    <div>
                      <dt className="tech-label">Telephone</dt>
                      <dd className="mt-1.5">
                        <a
                          href={`tel:${person.phone.replace(/\s/g, '')}`}
                          className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Phone
                            className="h-4 w-4 shrink-0 text-subtle"
                            aria-hidden="true"
                          />
                          <span className="font-mono underline decoration-border underline-offset-4 transition-colors group-hover:decoration-foreground">
                            {person.phone}
                          </span>
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </article>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      {/* Shareholding & Technical Structure */}
      <Section tone="sunken" rule labelledBy="governance-heading">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal kind="rise">
            <h2
              id="governance-heading"
              className="font-display text-2xl font-bold tracking-tight"
            >
              Shareholding Structure
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Nominal share capital: {company.shareholding.nominalCapital}.
            </p>
            <div className="mt-6 divide-y divide-hairline rounded-xl border border-hairline bg-card p-6 shadow-card">
              {company.shareholding.directors.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <span className="font-display text-sm font-semibold">
                      {d.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-medium text-brand-700 dark:text-brand-400">
                      {d.shares} shares ({d.percentage})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal kind="rise" delay={0.08}>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Technical Departments
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Engineering-led execution model across five operating divisions.
            </p>
            <div className="mt-6 space-y-4 rounded-xl border border-hairline bg-card p-6 text-sm leading-7 text-muted-foreground shadow-card">
              <p>
                Each technical department is headed by a qualified engineer. The
                company maintains permanent staff for project construction, site
                supervision and the supplies function, with additional
                specialist labour engaged as project requirements dictate.
              </p>
              <p>
                Our workforce is experienced across all sectors in which the
                group operates across Kenya, Tanzania, Uganda, Rwanda, and
                Burundi.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section tone="sunken" rule width="prose" labelledBy="chair-heading">
        <h2 id="chair-heading" className="tech-label">
          The chairperson&rsquo;s message
        </h2>
        <Reveal kind="unblur" className="mt-8">
          <blockquote className="space-y-6">
            {company.chairmanMessage.map((paragraph) => (
              <p
                key={paragraph}
                className="font-display text-xl font-medium leading-9 tracking-tight sm:text-[1.5rem] sm:leading-10"
              >
                {paragraph}
              </p>
            ))}
          </blockquote>
          <p className="mt-10 font-display text-lg font-bold tracking-tight text-brand-700 dark:text-brand-400">
            &ldquo;{company.chairmanMotto}&rdquo;
          </p>
          <p className="mt-2 text-sm text-subtle">
            {chair.name} · {chair.role}
          </p>
        </Reveal>
      </Section>

      <CtaBanner
        title="Reach the right person directly"
        body="General enquiries, prequalification documents and project discussions are all handled from the head office in Nairobi."
        primary={{ label: 'Contact the office', href: '/contact' }}
        secondary={{
          label: 'Send a request for quotation',
          href: '/request-rfq',
        }}
      />
    </>
  );
}
