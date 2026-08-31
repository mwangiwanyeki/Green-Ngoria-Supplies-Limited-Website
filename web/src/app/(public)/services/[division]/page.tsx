import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/marketing/page-hero';
import { Section, SectionIntro } from '@/components/marketing/section';
import { ServiceIcon } from '@/components/marketing/service-icon';
import { ScopeRegister } from '@/components/marketing/spec-panel';
import { Reveal, RevealItem } from '@/components/marketing/reveal';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { getServiceDivision, serviceDivisions } from '@/config/services';
import { company } from '@/config/company';

export function generateStaticParams() {
  return serviceDivisions.map((division) => ({ division: division.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ division: string }>;
}): Promise<Metadata> {
  const { division: slug } = await params;
  const division = getServiceDivision(slug);
  if (!division) return {};

  return {
    title: division.name,
    description: division.summary,
    openGraph: {
      title: `${division.name} | ${company.legalName}`,
      description: division.summary,
      type: 'website',
      url: `/services/${division.slug}`,
    },
  };
}

export default async function ServiceDivisionPage({
  params,
}: {
  params: Promise<{ division: string }>;
}) {
  const { division: slug } = await params;
  const division = getServiceDivision(slug);
  if (!division) notFound();

  const otherDivisions = serviceDivisions.filter((d) => d.slug !== slug);

  return (
    <>
      <PageHero
        title={division.headline}
        lead={division.intro[0]}
        primaryAction={division.cta}
        secondaryAction={{ label: 'All ten divisions', href: '/services' }}
        facts={[
          { term: 'Division', value: division.name },
          { term: 'Category', value: division.eyebrow },
          {
            term: 'Recorded scope items',
            value: String(division.scope.length),
          },
          {
            term: division.reach ? division.reach.title : 'Delivered across',
            value: division.reach
              ? division.reach.items.slice(0, 2).join(' · ')
              : 'Kenya · Tanzania · Uganda · Rwanda · Burundi',
          },
        ]}
      />

      {/* Narrative + scope register */}
      <Section labelledBy="division-scope">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
          <Reveal kind="rise">
            <span className="mb-7 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-hairline bg-card text-brand-700 shadow-low dark:text-brand-400">
              <ServiceIcon name={division.icon} className="h-6 w-6" />
            </span>
            <h2
              id="division-scope"
              className="font-display text-display-md font-bold"
            >
              What this division does
            </h2>
            <div className="measure mt-6 space-y-5 text-base leading-8 text-muted-foreground">
              {division.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Reveal>

          <Reveal kind="wipe" delay={0.06}>
            <h3 className="tech-label">
              Scope of work — as recorded in the company profile
            </h3>
            <ScopeRegister
              items={division.scope}
              columns={1}
              className="mt-4"
            />
          </Reveal>
        </div>
      </Section>

      {/* Grouped product / capability registers */}
      {division.groups && division.groups.length > 0 && (
        <Section tone="sunken" rule labelledBy="division-detail">
          <SectionIntro
            id="division-detail"
            title={
              division.slug === 'gold-mining'
                ? 'How the mining business is directed'
                : 'Products and sub-divisions'
            }
            align="stack"
          />
          <div className="mt-14 space-y-14">
            {division.groups.map((group) => (
              <div
                key={group.title}
                className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16"
              >
                <div>
                  <h3 className="font-display text-lg font-bold tracking-tight">
                    {group.title}
                  </h3>
                  {group.description && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {group.description}
                    </p>
                  )}
                </div>
                <ScopeRegister items={group.items} columns={2} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Reach / sectors / applications */}
      {division.reach && (
        <Section rule labelledBy="division-reach">
          <SectionIntro
            id="division-reach"
            title={division.reach.title}
            align="stack"
          />
          <Reveal
            kind="draw"
            as="ul"
            className="mt-10 grid border-t border-hairline sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-10"
          >
            {division.reach.items.map((item) => (
              <RevealItem
                key={item}
                as="li"
                className="border-b border-hairline py-4 text-sm leading-6"
              >
                {item}
              </RevealItem>
            ))}
          </Reveal>
        </Section>
      )}

      {/* Standing commitments */}
      <Section tone="sunken" rule labelledBy="division-commitments">
        <SectionIntro
          id="division-commitments"
          title="What holds true on every division's work"
          align="stack"
        />
        <Reveal
          kind="draw"
          as="dl"
          className="mt-12 grid gap-x-12 gap-y-10 border-t border-hairline pt-10 lg:grid-cols-3"
        >
          {[
            {
              term: 'Health, safety and environment',
              value:
                'Environment, Health and Safety is given priority in all projects the company undertakes, and is treated as a competitive strength that benefits clients, shareholders and employees alike.',
            },
            {
              term: 'Independent quality control',
              value:
                'Recognised quality-control institutions and materials consultants are contracted to perform the tests that confirm quality products on our work.',
            },
            {
              term: 'Regional delivery',
              value: `Green Ngoria operates across ${company.regions
                .map((r) => r.name)
                .join(
                  ', ',
                )}, with head office at Rehema House on Standard Street, Nairobi.`,
            },
          ].map((item) => (
            <RevealItem key={item.term}>
              <dt className="font-display text-base font-bold tracking-tight">
                {item.term}
              </dt>
              <dd className="mt-3 text-sm leading-7 text-muted-foreground">
                {item.value}
              </dd>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      {/* Other divisions */}
      <Section rule labelledBy="other-divisions">
        <SectionIntro
          id="other-divisions"
          title="Also from Green Ngoria"
          action={
            <Link href="/services">
              <Button
                variant="outline"
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Open the division index
              </Button>
            </Link>
          }
        />
        <Reveal
          kind="draw"
          as="ul"
          className="mt-12 grid border-t border-hairline sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-10"
        >
          {otherDivisions.map((other) => (
            <RevealItem
              key={other.slug}
              as="li"
              className="border-b border-hairline"
            >
              <Link
                href={`/services/${other.slug}`}
                className="group flex items-center gap-4 py-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-hairline bg-card text-muted-foreground transition-colors duration-micro group-hover:border-brand-500/40 group-hover:text-brand-700 dark:group-hover:text-brand-400">
                  <ServiceIcon name={other.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {other.name}
                  </span>
                  <span className="block truncate text-xs text-subtle">
                    {other.eyebrow}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-subtle transition-transform duration-ui ease-out-expo group-hover:translate-x-1"
                />
              </Link>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      <CtaBanner
        title={division.cta.label}
        body={`Reach the office on ${company.contact.phones[0].value} or email ${company.contact.emails[0].value} — or send the details through the enquiry form and the team will come back to you.`}
        primary={division.cta}
        secondary={{ label: 'Contact the Nairobi office', href: '/contact' }}
      />
    </>
  );
}
