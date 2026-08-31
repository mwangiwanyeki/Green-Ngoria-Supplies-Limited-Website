import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/marketing/page-hero';
import { Section, SectionIntro } from '@/components/marketing/section';
import { SpecPanel, ScopeRegister } from '@/components/marketing/spec-panel';
import { RegionalReach } from '@/components/marketing/regional-reach';
import { Reveal, RevealItem } from '@/components/marketing/reveal';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { company } from '@/config/company';

const title = 'About Green Ngoria';
const description =
  'Incorporated in Kenya on 27 September 2011, Green Ngoria Supplies Limited provides mining, construction, engineering, importation and supply services across Kenya, Tanzania, Uganda, Rwanda and Burundi.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} | ${company.legalName}`,
    description,
    type: 'website',
    url: '/about',
  },
};

export default function AboutPage() {
  const chair = company.leadership[0];

  return (
    <>
      <PageHero
        title="A mining company that grew its own engineering, construction and supply capability"
        lead={company.background.slice(0, 2)}
        primaryAction={{ label: 'Meet the leadership', href: '/leadership' }}
        secondaryAction={{ label: 'See our projects', href: '/projects' }}
        facts={[
          {
            term: 'Incorporated',
            value: company.registration.incorporated,
          },
          {
            term: 'Company number',
            value: company.registration.companyNumber,
          },
          { term: 'KRA PIN', value: company.registration.kraPin },
          {
            term: 'Certified to',
            value: company.certifications.map((c) => c.name).join(' · '),
          },
        ]}
      />

      {/* Background + registration datasheet */}
      <Section labelledBy="background-heading">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20">
          <Reveal kind="rise">
            <h2
              id="background-heading"
              className="font-display text-display-md font-bold"
            >
              From mining in Tanzania to five countries in East and Central
              Africa
            </h2>
            <div className="measure mt-6 space-y-5 text-base leading-8 text-muted-foreground">
              {company.background.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/services">
                <Button
                  variant="brand"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Explore the ten divisions
                </Button>
              </Link>
              <Link href="/gold-processing">
                <Button variant="outline">See the Bondo plant</Button>
              </Link>
            </div>
          </Reveal>

          <Reveal kind="rise" delay={0.08}>
            <SpecPanel
              title="Company at a glance"
              rows={[
                { term: 'Registered name', value: company.legalName },
                { term: 'Entity type', value: company.registration.entityType },
                {
                  term: 'Incorporated',
                  value: company.registration.incorporated,
                },
                {
                  term: 'Company number',
                  value: company.registration.companyNumber,
                  mono: true,
                },
                {
                  term: 'KRA PIN',
                  value: company.registration.kraPin,
                  mono: true,
                },
                {
                  term: 'Nominal share capital',
                  value: company.registration.nominalShareCapital,
                },
                { term: 'Head office', value: company.contact.addressOneLine },
                { term: 'Postal address', value: company.contact.postal },
              ]}
              footnote={
                <Link
                  href="/certifications"
                  className="inline-flex items-center gap-1.5 font-semibold text-brand-700 underline decoration-brand-700/30 underline-offset-4 transition-colors hover:decoration-brand-700 dark:text-brand-400 dark:decoration-brand-400/30 dark:hover:decoration-brand-400"
                >
                  See certifications and compliance
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              }
            />
          </Reveal>
        </div>
      </Section>

      {/* Chairman's message */}
      <Section tone="sunken" rule width="prose" labelledBy="chair-heading">
        <h2 id="chair-heading" className="tech-label">
          From the chairperson
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
          <Link href="/leadership" className="mt-8 inline-block">
            <Button variant="outline">Meet the leadership team</Button>
          </Link>
        </Reveal>
      </Section>

      {/* Vision & mission */}
      <Section rule labelledBy="direction-heading">
        <SectionIntro
          id="direction-heading"
          title="Where the company is going, and how"
          align="stack"
        />
        <div className="mt-12 grid gap-12 border-t border-hairline pt-12 lg:grid-cols-2 lg:gap-20">
          <Reveal kind="rise">
            <h3 className="tech-label">Vision</h3>
            <p className="measure mt-5 text-lg leading-9 tracking-tight">
              {company.vision}
            </p>
          </Reveal>
          <Reveal kind="rise" delay={0.06}>
            <h3 className="tech-label">Mission</h3>
            <p className="measure mt-5 text-lg leading-9 tracking-tight text-muted-foreground">
              {company.mission}
            </p>
          </Reveal>
        </div>
      </Section>

      {/* Values */}
      <Section tone="sunken" rule labelledBy="values-heading">
        <SectionIntro
          id="values-heading"
          title="Nine values that govern how we work"
          align="stack"
        />
        <Reveal
          kind="draw"
          as="dl"
          className="mt-12 grid gap-x-12 border-t border-hairline sm:grid-cols-2 lg:grid-cols-3"
        >
          {company.values.map((value) => (
            <RevealItem
              key={value.name}
              className="border-b border-hairline py-6"
            >
              <dt className="font-display text-base font-bold tracking-tight">
                {value.name}
              </dt>
              <dd className="mt-2 text-sm leading-6 text-muted-foreground">
                {value.description}
              </dd>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      {/* Growth strategies */}
      <Section rule labelledBy="growth-heading">
        <SectionIntro
          id="growth-heading"
          title="Six commitments that direct the mining business"
          align="stack"
        />
        <Reveal
          kind="draw"
          as="dl"
          className="mt-12 grid gap-x-12 border-t border-hairline sm:grid-cols-2 lg:grid-cols-3"
        >
          {company.growthStrategies.map((strategy) => (
            <RevealItem
              key={strategy.name}
              className="border-b border-hairline py-6"
            >
              <dt className="font-display text-base font-bold tracking-tight">
                {strategy.name}
              </dt>
              <dd className="mt-2 text-sm leading-6 text-muted-foreground">
                {strategy.description}
              </dd>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      {/* Quality + HSE */}
      <Section tone="sunken" rule labelledBy="assurance-heading">
        <SectionIntro
          id="assurance-heading"
          title="Quality tested by recognised institutions, safety treated as a strength"
          align="stack"
        />
        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal kind="wipe">
            <h3 className="tech-label">Quality assurance</h3>
            <p className="measure mt-4 text-sm leading-7 text-muted-foreground">
              {company.qualityAssurance.summary}
            </p>
            <ScopeRegister
              items={company.qualityAssurance.points}
              columns={1}
              className="mt-6"
            />
          </Reveal>
          <Reveal kind="wipe" delay={0.06}>
            <h3 className="tech-label">Health, safety and environment</h3>
            <p className="measure mt-4 text-sm leading-7 text-muted-foreground">
              {company.hse.summary}
            </p>
            <ScopeRegister
              items={company.hse.points}
              columns={1}
              className="mt-6"
            />
          </Reveal>
        </div>
      </Section>

      {/* Regional reach */}
      <Section rule labelledBy="reach-heading">
        <SectionIntro
          id="reach-heading"
          title="Five countries across East and Central Africa"
          align="stack"
        />
        <RegionalReach className="mt-14" />
      </Section>

      <CtaBanner
        title="Work with Green Ngoria"
        body="Whether the requirement is a mining or processing project, a building or civil works package, an electrical or mechanical scope, or a supply contract, the same office handles the first conversation."
        primary={{
          label: 'Send a request for quotation',
          href: '/request-rfq',
        }}
        secondary={{ label: 'Contact the Nairobi office', href: '/contact' }}
      />
    </>
  );
}
