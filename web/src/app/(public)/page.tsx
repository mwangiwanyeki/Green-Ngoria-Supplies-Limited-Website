import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrganizationJsonLd } from '@/components/marketing/organization-jsonld';
import { HomeHero } from '@/components/marketing/home-hero';
import { TrustStrip } from '@/components/marketing/trust-strip';
import { Section, SectionIntro } from '@/components/marketing/section';
import { Reveal, RevealItem } from '@/components/marketing/reveal';
import { ProcessFlowDiagram } from '@/components/marketing/process-flow-diagram';
import { LifecycleTrack } from '@/components/marketing/lifecycle-track';
import {
  CapabilityIndex,
  capabilityGroups,
} from '@/components/marketing/capability-index';
import { ProjectRecord } from '@/components/marketing/project-record';
import { RegionalReach } from '@/components/marketing/regional-reach';
import { SpecPanel, ScopeRegister } from '@/components/marketing/spec-panel';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { company } from '@/config/company';
import { capabilityPages } from '@/config/capabilities';
import {
  goldCircuitStages,
  goldCircuitDisclaimer,
} from '@/config/gold-circuit';

const description =
  'Green Ngoria Supplies Limited: gold and gemstone mining, a NEMA-approved gold processing plant at Bondo, mining-plant engineering and construction, mechanical and electrical services, and supply across East and Central Africa.';

export const metadata: Metadata = {
  title: 'Mining, Mineral Processing & Plant Engineering in East Africa',
  description,
  openGraph: {
    title: `${company.legalName} — mining, mineral processing and plant engineering`,
    description,
    type: 'website',
    url: '/',
  },
};

const miningPathway = capabilityPages.mining;
const equipment = capabilityPages.equipment;
const assessment = capabilityPages['technical-assessment'];

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />

      {/* 1 — Hero */}
      <HomeHero
        countries={company.regions.map((region) => region.name)}
        disciplines={[
          'Mining',
          'Mineral processing',
          'Civil',
          'Mechanical',
          'Electrical',
        ]}
      />

      {/* 2 — Trust / credibility strip */}
      <TrustStrip />

      {/* 3 — Core mining capability */}
      <Section labelledBy="mining-heading">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20">
          <Reveal kind="rise">
            <h2
              id="mining-heading"
              className="font-display text-display-lg font-bold"
            >
              A mining company that grew its own engineering and supply
              capability
            </h2>
            <div className="measure mt-7 space-y-5 text-base leading-8 text-muted-foreground sm:text-[1.0625rem]">
              {company.background.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/mining">
                <Button
                  variant="brand"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  See the mining operation
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline">Read the company background</Button>
              </Link>
            </div>
          </Reveal>

          <Reveal kind="rise" delay={0.08}>
            <h3 className="tech-label">Operating sites</h3>
            <Reveal
              kind="draw"
              as="ul"
              className="mt-4 border-t border-hairline"
            >
              {company.operations.miningSites.map((site) => (
                <RevealItem
                  key={site.name}
                  as="li"
                  className="border-b border-hairline py-6"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h4 className="font-display text-lg font-semibold tracking-tight">
                      {site.name}
                    </h4>
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700 dark:text-brand-400">
                      {site.commodity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {site.detail}
                  </p>
                </RevealItem>
              ))}
            </Reveal>
          </Reveal>
        </div>
      </Section>

      {/* 4 — Gold processing / CIP / CIL */}
      <Section tone="sunken" rule labelledBy="circuit-heading">
        <SectionIntro
          id="circuit-heading"
          title="How gold moves through a carbon-in-pulp circuit"
          lead="Crushing, grinding, classification, leaching, adsorption, elution and tailings — the sequence a processing plant is built around. Select a stage to read what it does and the equipment it usually involves."
          action={
            <Link href="/gold-processing">
              <Button
                variant="outline"
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Our Bondo plant
              </Button>
            </Link>
          }
        />
        <ProcessFlowDiagram
          className="mt-14"
          stages={goldCircuitStages}
          initialStageId="adsorption"
          disclaimer={goldCircuitDisclaimer}
        />
      </Section>

      {/* 5 — Plant lifecycle */}
      <Section rule labelledBy="lifecycle-heading">
        <SectionIntro
          id="lifecycle-heading"
          title="From first conversation to an operating plant"
          lead={miningPathway.intro}
          align="stack"
        />
        <LifecycleTrack
          stages={[...miningPathway.lifecycle]}
          className="mt-14"
        />

        <Reveal
          kind="draw"
          as="ul"
          className="mt-16 grid gap-x-10 gap-y-8 border-t border-hairline pt-10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {(
            [
              'mining-plant-engineering',
              'mining-plant-construction',
              'plant-optimization',
            ] as const
          ).map((slug) => {
            const page = capabilityPages[slug];
            return (
              <RevealItem key={slug} as="li">
                <Link href={`/${slug}`} className="group block">
                  <h3 className="font-display text-lg font-semibold tracking-tight underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-brand-600 dark:group-hover:decoration-brand-400">
                    {page.title}
                  </h3>
                  <p className="measure mt-2.5 text-sm leading-6 text-muted-foreground">
                    {page.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-400">
                    Open the capability
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform duration-ui ease-out-expo group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              </RevealItem>
            );
          })}
        </Reveal>
      </Section>

      {/* 6 — Technical plant assessment */}
      <Section tone="sunken" rule labelledBy="assessment-heading">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
          <Reveal kind="rise">
            <h2
              id="assessment-heading"
              className="font-display text-display-md font-bold"
            >
              {assessment.title}
            </h2>
            <p className="measure mt-6 text-base leading-8 text-muted-foreground">
              {assessment.intro}
            </p>
            <p className="measure mt-5 text-sm leading-7 text-subtle">
              {assessment.note}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/technical-assessment">
                <Button
                  variant="brand"
                  size="lg"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Request a plant assessment
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg">
                  Speak to an engineer first
                </Button>
              </Link>
            </div>
          </Reveal>

          <Reveal kind="wipe" delay={0.06}>
            <h3 className="tech-label">What the assessment captures</h3>
            <ScopeRegister
              items={assessment.capabilities}
              columns={1}
              className="mt-4"
            />
          </Reveal>
        </div>
      </Section>

      {/* 7 — Equipment & spares */}
      <Section rule labelledBy="equipment-heading">
        <SectionIntro
          id="equipment-heading"
          title={equipment.title}
          lead={equipment.intro}
          action={
            <div className="flex flex-wrap gap-3">
              <Link href="/equipment">
                <Button variant="brand">Browse equipment categories</Button>
              </Link>
              <Link href="/spares">
                <Button variant="outline">Request spare parts</Button>
              </Link>
            </div>
          }
        />
        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
          <Reveal kind="wipe">
            <h3 className="tech-label">Equipment categories</h3>
            <ScopeRegister
              items={equipment.capabilities}
              columns={2}
              className="mt-4"
            />
          </Reveal>
          <Reveal kind="rise" delay={0.08}>
            <SpecPanel
              tone="accent"
              title="How an enquiry becomes a quotation"
              caption={capabilityPages.spares.intro}
              rows={equipment.lifecycle.map((stage, index) => ({
                term: `Step ${String(index + 1).padStart(2, '0')}`,
                value: stage,
              }))}
              footnote={equipment.note}
            />
          </Reveal>
        </div>
      </Section>

      {/* 8 — Featured projects */}
      <Section tone="sunken" rule labelledBy="projects-heading">
        <SectionIntro
          id="projects-heading"
          title="Delivered for banks, insurers and institutions"
          lead="Building, refurbishment, aluminium and mechanical packages completed in Rwanda and Burundi. Nothing is listed that has not been delivered."
          action={
            <Link href="/projects">
              <Button
                variant="outline"
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                See all {company.projects.length} projects
              </Button>
            </Link>
          }
        />
        <Reveal
          kind="draw"
          as="ul"
          className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {company.projects.slice(0, 3).map((project) => (
            <RevealItem key={project.title} as="li" className="h-full">
              <ProjectRecord project={project} />
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      {/* 9 — Engineering and construction capabilities */}
      <Section rule labelledBy="divisions-heading">
        <SectionIntro
          id="divisions-heading"
          title="Ten divisions under one company"
          lead="Every technical department is headed by a qualified engineer, and the company maintains qualified staff for project construction, project supervision and supplies."
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
        <CapabilityIndex groups={capabilityGroups} className="mt-16" />
      </Section>

      {/* 10 — HSE, sustainability and quality */}
      <Section tone="sunken" rule labelledBy="hse-heading">
        <SectionIntro
          id="hse-heading"
          title="Safety, environment and quality are verified, not asserted"
          lead={company.hse.summary}
          align="stack"
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal kind="wipe">
            <h3 className="tech-label">Environment, health and safety</h3>
            <ScopeRegister
              items={company.hse.points}
              columns={1}
              className="mt-4"
            />
          </Reveal>
          <Reveal kind="wipe" delay={0.06}>
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
        </div>

        <Reveal kind="rise" className="mt-16 border-t border-hairline pt-12">
          <blockquote className="measure font-display text-xl font-medium leading-9 tracking-tight sm:text-2xl sm:leading-10">
            {company.vision}
          </blockquote>
          <p className="mt-5 text-sm text-subtle">
            Green Ngoria Supplies Limited — company vision
          </p>
        </Reveal>
      </Section>

      {/* 11 — East Africa reach */}
      <Section rule labelledBy="reach-heading">
        <SectionIntro
          id="reach-heading"
          title="Five countries, run from one office in Nairobi"
          lead={`Head office is at ${company.contact.addressOneLine}, with a regional contact number in Uganda.`}
          align="stack"
        />
        <RegionalReach className="mt-14" />
      </Section>

      {/* 12 — Client CTA + 13 — Footer */}
      <CtaBanner />
    </>
  );
}
