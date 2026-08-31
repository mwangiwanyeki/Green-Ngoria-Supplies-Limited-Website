import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/marketing/page-hero';
import { Section, SectionIntro } from '@/components/marketing/section';
import { SpecPanel, ScopeRegister } from '@/components/marketing/spec-panel';
import { ProcessFlowDiagram } from '@/components/marketing/process-flow-diagram';
import { Reveal, RevealItem } from '@/components/marketing/reveal';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { company } from '@/config/company';
import {
  goldCircuitStages,
  goldCircuitDisclaimer,
} from '@/config/gold-circuit';

const title = 'Gold Processing & Operations';
const description =
  'The NEMA-approved small-scale gold processing plant at Bondo, Siaya County, and Green Ngoria mining sites in Kenya and Tanzania.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} | ${company.legalName}`,
    description,
    type: 'website',
    url: '/gold-processing',
  },
};

const plant = company.operations.processingPlant;

export default function GoldProcessingPage() {
  return (
    <>
      <PageHero
        title="A NEMA-approved gold processing plant at Bondo, Siaya County"
        lead={[
          'Green Ngoria operates its own gold mining and processing activity. The centre of the Kenyan operation is a small-scale gold processing plant at Bondo in Siaya County, approved by the Office of the County Director of Environment.',
          'Mining feeds that plant from company sites at Bondo and Taita Taveta in Kenya, alongside the mining activity in Tanzania where the business began.',
        ]}
        primaryAction={{ label: 'Discuss an operation', href: '/contact' }}
        secondaryAction={{
          label: 'Gold mining division',
          href: '/services/gold-mining',
        }}
        facts={[
          { term: 'Facility', value: 'Small-scale gold processing plant' },
          { term: 'Location', value: 'Bondo Sub-County, Siaya County' },
          { term: 'Approval reference', value: 'NEMA/PR/SYA/002' },
          { term: 'Approval date', value: '24 July 2019' },
        ]}
      />

      {/* The plant + regulatory datasheet */}
      <Section labelledBy="plant-heading">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20">
          <Reveal kind="rise">
            <h2
              id="plant-heading"
              className="font-display text-display-md font-bold"
            >
              {plant.name}
            </h2>
            <div className="measure mt-6 space-y-5 text-base leading-8 text-muted-foreground">
              <p>
                {plant.description} The site is Plot L.R. No. Nyangoma/1352 in
                Bondo Sub-County.
              </p>
              <p>
                Production at the plant is the responsibility of the company
                production manager, who coordinates plant and site teams against
                programme. Work on the site is carried out under the Green
                Ngoria health, safety and environment policy, which gives
                Environment, Health and Safety priority in every project the
                company undertakes.
              </p>
              <p>
                Environmental performance is not treated as a side condition of
                operating: the company&rsquo;s mission commits it to introducing
                new and state-of-the-art mining practices and technologies in
                order to promote long-term shareholder value, environmental
                protection and the wellbeing of the communities it works with.
              </p>
            </div>
          </Reveal>

          <Reveal kind="rise" delay={0.08}>
            <SpecPanel
              tone="accent"
              title="Regulatory approval"
              rows={[
                { term: 'Facility', value: plant.name },
                { term: 'Location', value: plant.location },
                {
                  term: 'Approval reference',
                  value: plant.approval,
                  mono: true,
                },
                { term: 'Approving body', value: plant.approvalBody },
                {
                  term: 'Mining licences',
                  value: 'Stamp duty on mining licences paid 29 October 2019',
                },
                {
                  term: 'County permit',
                  value:
                    'Single Business Permit issued by the County Government of Siaya',
                },
              ]}
              footnote="Copies of the approval, permit and licence documents are held on file and can be provided during prequalification."
            />
          </Reveal>
        </div>
      </Section>

      {/* CIP / CIL process storytelling */}
      <Section tone="sunken" rule labelledBy="circuit-heading">
        <SectionIntro
          id="circuit-heading"
          title="How gold moves through a carbon-in-pulp circuit"
          lead="Crushing, grinding, classification, leaching, adsorption, elution and tailings — the sequence a gold processing plant is built around. Select a stage to read what it does and the equipment it usually involves."
          align="stack"
        />
        <ProcessFlowDiagram
          className="mt-14"
          stages={goldCircuitStages}
          initialStageId="adsorption"
          disclaimer={goldCircuitDisclaimer}
        />
      </Section>

      {/* Mining sites */}
      <Section rule labelledBy="sites-heading">
        <SectionIntro
          id="sites-heading"
          title="Where Green Ngoria mines"
          lead="Alongside gold, the company owns two gemstone mines — one in Kenya and one in Tanzania — and is involved in international gemstone mining, development and marketing."
          align="stack"
        />
        <Reveal
          kind="draw"
          as="dl"
          className="mt-14 grid border-t border-hairline lg:grid-cols-3 lg:gap-x-16"
        >
          {company.operations.miningSites.map((site) => (
            <RevealItem
              key={site.name}
              className="border-b border-hairline py-7 lg:border-b-0"
            >
              <dt>
                <span className="block font-display text-xl font-bold tracking-tight">
                  {site.name}
                </span>
                <span className="mt-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-brand-700 dark:text-brand-400">
                  {site.commodity} · {site.country}
                </span>
              </dt>
              <dd className="measure mt-3 text-sm leading-7 text-muted-foreground">
                {site.detail}
              </dd>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      {/* Plant and machinery */}
      <Section tone="sunken" rule labelledBy="machinery-heading">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal kind="rise">
            <h2
              id="machinery-heading"
              className="font-display text-display-md font-bold"
            >
              Equipment maintained for our own sites
            </h2>
            <div className="measure mt-6 space-y-5 text-base leading-8 text-muted-foreground">
              <p>
                Green Ngoria runs machinery for its mining operations and
                maintains in-house mechanical and electrical departments to keep
                it working. Those departments have carried mechanical works
                contracts for more than ten years, including specialised
                erection work in the oil industry and power sector, and cover
                installation, testing, commissioning and preventive maintenance.
              </p>
              <p>
                The same capability is available to clients: the mechanical and
                electrical divisions take on external contracts as well as
                supporting the company&rsquo;s own plant.
              </p>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/services/mechanical">
                <Button variant="outline">Mechanical division</Button>
              </Link>
              <Link href="/services/electrical-services">
                <Button variant="outline">Electrical division</Button>
              </Link>
            </div>
          </Reveal>

          <Reveal kind="wipe" delay={0.06}>
            <h3 className="tech-label">
              Environment, health and safety on site
            </h3>
            <ScopeRegister
              items={company.hse.points}
              columns={1}
              className="mt-4"
            />
          </Reveal>
        </div>
      </Section>

      {/* Growth commitments */}
      <Section rule labelledBy="growth-heading">
        <SectionIntro
          id="growth-heading"
          title="Six growth commitments direct the operation"
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

      <CtaBanner
        title="Talk to us about mining and processing"
        body="For partnership, offtake, supply or contracting enquiries relating to our mining and processing operations, contact the managing director's office in Nairobi."
        primary={{ label: 'Contact the office', href: '/contact' }}
        secondary={{
          label: 'See certifications and compliance',
          href: '/certifications',
        }}
      />
    </>
  );
}
