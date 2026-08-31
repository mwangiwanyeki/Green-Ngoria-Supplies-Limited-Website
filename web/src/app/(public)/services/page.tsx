import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/marketing/page-hero';
import { Section, SectionIntro } from '@/components/marketing/section';
import { Reveal } from '@/components/marketing/reveal';
import { ScopeRegister } from '@/components/marketing/spec-panel';
import {
  CapabilityIndex,
  capabilityGroups,
} from '@/components/marketing/capability-index';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { serviceDivisions } from '@/config/services';
import { company } from '@/config/company';

const title = 'Service Divisions';
const description =
  'Ten service divisions: gold and gemstone mining, building works, road construction, water projects, mechanical, electrical, oil and petroleum, timber importation and general supplies.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} | ${company.legalName}`,
    description,
    type: 'website',
    url: '/services',
  },
};

export default function ServicesIndexPage() {
  const scopeItems = serviceDivisions.reduce(
    (total, division) => total + division.scope.length,
    0,
  );

  return (
    <>
      <PageHero
        title="Ten service divisions under one company"
        lead={[
          'Green Ngoria Supplies Limited was formed to provide gold and gemstone mining, civil works, building works, timber importation, oil importation and general supplies. Those activities are organised today into ten divisions.',
          'Every technical department is headed by a qualified engineer, and the company maintains qualified staff for project construction, project supervision and supplies.',
        ]}
        primaryAction={{
          label: 'Send a request for quotation',
          href: '/request-rfq',
        }}
        secondaryAction={{ label: 'Talk to the team', href: '/contact' }}
        facts={[
          { term: 'Divisions', value: String(serviceDivisions.length) },
          { term: 'Recorded scope items', value: String(scopeItems) },
          {
            term: 'Countries',
            value: company.regions.map((r) => r.name).join(' · '),
          },
          {
            term: 'Certified to',
            value: company.certifications.map((c) => c.name).join(' · '),
          },
        ]}
      />

      <Section labelledBy="index-heading">
        <SectionIntro
          id="index-heading"
          title="The division index"
          lead="Grouped the way the company profile groups them — mining first, then the construction, engineering and supply capability built around it."
          align="stack"
        />
        <CapabilityIndex groups={capabilityGroups} className="mt-16" />
      </Section>

      <Section tone="sunken" rule labelledBy="assurance-heading">
        <SectionIntro
          id="assurance-heading"
          title="How the work is checked"
          lead="Quality is verified independently rather than asserted, and environment, health and safety is treated as a competitive strength rather than an administrative overhead."
          align="stack"
          action={
            <Link href="/certifications">
              <Button variant="outline">See the compliance record</Button>
            </Link>
          }
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
            <h3 className="tech-label">Health, safety & environment</h3>
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

      <CtaBanner
        title="Tell us what you need supplied or built"
        body="Send the scope, quantities and delivery location and the enquiry reaches the right division directly."
        primary={{
          label: 'Send a request for quotation',
          href: '/request-rfq',
        }}
        secondary={{ label: 'Contact the Nairobi office', href: '/contact' }}
      />
    </>
  );
}
