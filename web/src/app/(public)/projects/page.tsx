import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/marketing/page-hero';
import { Section, SectionIntro } from '@/components/marketing/section';
import { ProjectRecord } from '@/components/marketing/project-record';
import { Reveal, RevealItem } from '@/components/marketing/reveal';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { company } from '@/config/company';

const title = 'Completed Projects';
const description =
  'Bank branch renovations, headquarters refurbishment, aluminium curtain walling and a design-and-build lift shaft core — completed projects in Rwanda and Burundi.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} | ${company.legalName}`,
    description,
    type: 'website',
    url: '/projects',
  },
};

export default function ProjectsPage() {
  const countries = Array.from(
    new Set(company.projects.map((project) => project.country)),
  );
  const sectors = Array.from(
    new Set(
      company.projects.map((project) => project.sector.split('/')[0].trim()),
    ),
  );

  return (
    <>
      <PageHero
        title="Completed projects across East and Central Africa"
        lead={[
          'Green Ngoria has delivered building, refurbishment, aluminium and mechanical packages for banks, insurers, a diocese and a hotel in Rwanda and Burundi.',
          'The projects listed below are the completed works recorded in the company profile. Nothing is listed here that has not been delivered.',
        ]}
        primaryAction={{ label: 'Discuss a project', href: '/contact' }}
        secondaryAction={{
          label: 'Building works division',
          href: '/services/building-works',
        }}
        facts={[
          {
            term: 'Completed projects',
            value: String(company.projects.length),
          },
          { term: 'Countries', value: countries.join(' · ') },
          { term: 'Client sectors', value: sectors.join(' · ') },
          { term: 'Status', value: 'All delivered and handed over' },
        ]}
      />

      <Section labelledBy="register-heading">
        <SectionIntro
          id="register-heading"
          title="The project register"
          lead="Each record carries the client, project type, discipline, scope and location exactly as they appear in the company profile."
          align="stack"
        />
        <Reveal
          kind="draw"
          as="ul"
          className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {company.projects.map((project) => (
            <RevealItem key={project.title} as="li" className="h-full">
              <ProjectRecord project={project} />
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      <Section tone="sunken" rule labelledBy="operations-heading">
        <SectionIntro
          id="operations-heading"
          title="Work in progress at our own operations"
          lead="Alongside client projects, Green Ngoria runs its own mining and processing operations: gold mining at Bondo in Siaya County and at Taita Taveta, mining activity in Tanzania, two company-owned gemstone mines, and a NEMA-approved small-scale gold processing plant at Bondo."
          action={
            <Link href="/gold-processing">
              <Button
                variant="outline"
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Our gold processing operations
              </Button>
            </Link>
          }
        />

        <Reveal
          kind="draw"
          as="dl"
          className="mt-14 grid border-t border-hairline lg:grid-cols-3 lg:gap-x-16"
        >
          {company.operations.miningSites.map((site) => (
            <RevealItem
              key={site.name}
              className="border-b border-hairline py-7 lg:border-b-0 lg:pb-0"
            >
              <dt>
                <span className="block font-display text-lg font-bold tracking-tight">
                  {site.name}
                </span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-brand-700 dark:text-brand-400">
                  {site.commodity}
                </span>
              </dt>
              <dd className="measure mt-3 text-sm leading-6 text-muted-foreground">
                {site.detail}
              </dd>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      <CtaBanner
        title="Have a project for us?"
        body="Send the scope, location and programme and the team will respond with the right division and a route to a quotation."
        primary={{
          label: 'Send a request for quotation',
          href: '/request-rfq',
        }}
        secondary={{ label: 'Browse the divisions', href: '/services' }}
      />
    </>
  );
}
