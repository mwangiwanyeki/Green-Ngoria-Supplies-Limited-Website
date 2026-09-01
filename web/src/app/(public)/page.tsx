import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Pickaxe,
  Factory,
  Wrench,
  ShieldCheck,
  Building2,
  Route,
  Droplets,
  Zap,
  Fuel,
  TreePine,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrganizationJsonLd } from '@/components/marketing/organization-jsonld';
import { GoldPlantFaqJsonLd } from '@/components/marketing/gold-plant-faq-jsonld';
import { HomeHero } from '@/components/marketing/home-hero';
import { TrustStrip } from '@/components/marketing/trust-strip';
import { Section, SectionIntro } from '@/components/marketing/section';
import { Reveal, RevealItem } from '@/components/marketing/reveal';
import { GoldCapabilitiesGrid } from '@/components/marketing/gold-capabilities-grid';
import { ProcessFlowDiagram } from '@/components/marketing/process-flow-diagram';
import { LifecycleTrack } from '@/components/marketing/lifecycle-track';
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
  'Green Ngoria Supplies Limited: active gold mining concessions in Bondo (Siaya) and Taita Taveta, NEMA-approved turnkey CIP/CIL gold processing plant construction, precision mining equipment supply and installation, and multi-disciplinary engineering across Kenya, Tanzania, and East Africa.';

export const metadata: Metadata = {
  title:
    'Gold Mining, CIP/CIL Processing Plants & Equipment Installation | Green Ngoria Supplies Limited',
  description,
  keywords: [
    'Gold mining Kenya',
    'Gold processing plant construction',
    'CIP CIL gold processing plants',
    'Mining equipment installation East Africa',
    'Bondo Siaya gold mine',
    'Taita Taveta mining',
    'Mineral processing engineering',
    'Carbon in pulp gold recovery',
    'Ball mill and crusher installation',
    'Gold electrowinning and smelting',
    'Mining EPC Kenya Tanzania',
  ],
  authors: [{ name: 'Green Ngoria Supplies Limited' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title:
      'Gold Mining, CIP/CIL Processing Plants & Equipment Installation | Green Ngoria Supplies Limited',
    description,
    type: 'website',
    url: '/',
    siteName: company.legalName,
    images: [
      {
        url: '/images/mining/poured-dore-bar-bondo.webp',
        width: 1200,
        height: 630,
        alt: 'Gold Mining & Plant Engineering — Green Ngoria Supplies Limited',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Gold Mining, CIP/CIL Processing Plants & Equipment Installation | Green Ngoria',
    description,
    images: ['/images/mining/poured-dore-bar-bondo.webp'],
  },
};

const miningPathway = capabilityPages.mining;
const equipment = capabilityPages.equipment;
const assessment = capabilityPages['technical-assessment'];

const supportingDivisions = [
  {
    title: 'Building Works & Infrastructure',
    description:
      'Engineered accommodation camps, plant admin complexes, secure gold rooms, and bank/institutional renovations.',
    href: '/services/building-works',
    icon: Building2,
  },
  {
    title: 'Mine Access Roads & Civil Earthworks',
    description:
      'Heavy haulage access roads, tailings dam earthworks, foundation pads, bridges, and storm drainage systems.',
    href: '/services/road-construction',
    icon: Route,
  },
  {
    title: 'Industrial Water & Reticulation',
    description:
      'Process water reservoirs, borehole networks, slurry reticulation pipelines, and containment treatment.',
    href: '/services/water-projects',
    icon: Droplets,
  },
  {
    title: 'Electrical & Automation',
    description:
      'Substations, MCC panels, high-voltage switchgear, plant PLC automation, and preventive maintenance.',
    href: '/services/electrical-services',
    icon: Zap,
  },
  {
    title: 'Fuel Logistics & Energy',
    description:
      'On-site bulk fuel storage depots, diesel delivery for heavy mining fleets, and industrial lubricants across all 47 counties.',
    href: '/services/oil-and-petroleum',
    icon: Fuel,
  },
  {
    title: 'Timber & Structural Shoring',
    description:
      'Certified hardwood, crane mats, shaft timbering, shoring dunnage, and custom-milled sizes for mining sites.',
    href: '/services/timber-importation',
    icon: TreePine,
  },
];

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />
      <GoldPlantFaqJsonLd />

      {/* 1 — Hero: Gold Mining, Processing Plants & Equipment Installation */}
      <HomeHero
        countries={company.regions.map((region) => region.name)}
        disciplines={[
          'Gold Mining',
          'CIP/CIL Processing Plants',
          'Equipment Installation',
          'Metallurgical Engineering',
          'Civil & Mechanical EPC',
        ]}
      />

      {/* 2 — Trust / Credibility Strip */}
      <TrustStrip />

      {/* 3 — Core Four Pillars: Gold Mining, Plant Construction, Equipment Installation & Optimization */}
      <Section labelledBy="gold-core-heading">
        <SectionIntro
          id="gold-core-heading"
          title="Engineered gold extraction from deposit to bullion"
          lead="Green Ngoria combines active mine concessions in Kenya and Tanzania with turnkey plant engineering, heavy equipment installation, and metallurgical recovery optimization."
          action={
            <Link href="/gold-processing">
              <Button
                variant="outline"
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Our Bondo gold processing plant
              </Button>
            </Link>
          }
        />
        <div className="mt-14">
          <GoldCapabilitiesGrid />
        </div>
      </Section>

      {/* 4 — Active Mining Sites & Ore Processing Operations */}
      <Section tone="sunken" rule labelledBy="operations-heading">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20">
          <Reveal kind="rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700 dark:text-brand-400">
              <Pickaxe className="h-3.5 w-3.5" />
              Active Concessions &amp; Facilities
            </span>
            <h2
              id="operations-heading"
              className="mt-4 font-display text-display-lg font-bold"
            >
              Producing gold concessions backed by statutory licensing
            </h2>
            <div className="measure mt-6 space-y-4 text-base leading-8 text-muted-foreground">
              <p>
                Green Ngoria operates producing gold sites at Bondo in Siaya
                County and in Taita Taveta, alongside established mining
                interests in Tanzania where the company first commenced
                operations.
              </p>
              <p>
                At the core of the Kenyan operation is a NEMA-approved small-scale
                gold processing plant (Ref: NEMA/PR/SYA/002) at Nyangoma, Bondo
                Sub-County — proving our capability to navigate rigorous
                environmental and technical compliance standards.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/services/gold-mining">
                <Button
                  variant="brand"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Explore gold mining operations
                </Button>
              </Link>
              <Link href="/certifications">
                <Button variant="outline">View licensing &amp; NEMA permits</Button>
              </Link>
            </div>
          </Reveal>

          <Reveal kind="rise" delay={0.08}>
            <h3 className="tech-label">Operating mining sites</h3>
            <Reveal
              kind="draw"
              as="ul"
              className="mt-4 border-t border-hairline"
            >
              {company.operations.miningSites.map((site) => (
                <RevealItem
                  key={site.name}
                  as="li"
                  className="flex items-start gap-5 border-b border-hairline py-6"
                >
                  {'image' in site && site.image && (
                    <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-xl border border-hairline bg-muted shadow-sm">
                      <Image
                        src={site.image as string}
                        alt={site.name}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-4">
                      <h4 className="font-display text-lg font-bold tracking-tight">
                        {site.name}
                      </h4>
                      <span className="shrink-0 rounded bg-brand-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand-700 dark:text-brand-400">
                        {site.commodity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {site.detail}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </Reveal>
          </Reveal>
        </div>
      </Section>

      {/* 5 — Gold Processing Flowsheet (CIP / CIL / Gravity Circuit) */}
      <Section rule labelledBy="circuit-heading">
        <SectionIntro
          id="circuit-heading"
          title="Carbon-in-Pulp (CIP) and Carbon-in-Leach (CIL) circuits"
          lead="From run-of-mine ore to poured doré bullion: explore the 7-stage mineral processing sequence engineered by Green Ngoria. Select a stage to examine its mechanical function, chemical kinetics, and equipment scope."
          action={
            <Link href="/gold-processing">
              <Button
                variant="brand"
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Bondo processing plant specs
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

      {/* 6 — Mining Equipment Supply & Turnkey Installation */}
      <Section tone="sunken" rule labelledBy="equipment-heading">
        <SectionIntro
          id="equipment-heading"
          title="Certified mining machinery and precision installation"
          lead="Turnkey supply, mechanical foundation casting, precision laser alignment, and electrical automation for gold processing plants and aggregate operations."
          action={
            <div className="flex flex-wrap gap-3">
              <Link href="/equipment">
                <Button variant="brand">Browse equipment catalogue</Button>
              </Link>
              <Link href="/spares">
                <Button variant="outline">Request plant spare parts</Button>
              </Link>
            </div>
          }
        />

        {/* Real Equipment Visual Gallery Showcase */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="group relative overflow-hidden rounded-xl border border-hairline bg-card shadow-sm transition-all hover:border-brand-500/40">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
              <Image
                src="/images/mining/ball-mill-installation-bondo.webp"
                alt="Ball mill grinding installation and alignment on reinforced plinth at Bondo"
                fill
                className="object-cover transition-transform duration-emphasis ease-out-expo group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <span className="rounded bg-brand-500/90 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-black">
                  Grinding &amp; Milling
                </span>
                <p className="mt-1 font-display text-sm font-semibold text-white">
                  Heavy Ball Mill Installation on Reinforced Plinth
                </p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-hairline bg-card shadow-sm transition-all hover:border-brand-500/40">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
              <Image
                src="/images/mining/centrifugal-concentrators.webp"
                alt="Centrifugal Knelson gravity concentrators ready for plant installation"
                fill
                className="object-cover transition-transform duration-emphasis ease-out-expo group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <span className="rounded bg-brand-500/90 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-black">
                  Gravity Recovery
                </span>
                <p className="mt-1 font-display text-sm font-semibold text-white">
                  Centrifugal Knelson Concentrators &amp; Separation
                </p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-hairline bg-card shadow-sm transition-all hover:border-brand-500/40 sm:col-span-2 lg:col-span-1">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
              <Image
                src="/images/mining/leach-cil-tank-construction.webp"
                alt="CIL leach tank construction and steel agitation foundation erection"
                fill
                className="object-cover transition-transform duration-emphasis ease-out-expo group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <span className="rounded bg-brand-500/90 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-black">
                  Leaching Tank Farm
                </span>
                <p className="mt-1 font-display text-sm font-semibold text-white">
                  CIL / CIP Agitation Tank Farm Civil Erection
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
          <Reveal kind="wipe">
            <h3 className="tech-label">Equipment supply &amp; installation scope</h3>
            <ScopeRegister
              items={equipment.capabilities}
              columns={2}
              className="mt-4"
            />
          </Reveal>
          <Reveal kind="rise" delay={0.08}>
            <SpecPanel
              tone="accent"
              title="How an equipment enquiry reaches on-site commissioning"
              caption={capabilityPages.spares.intro}
              rows={equipment.lifecycle.map((stage, index) => ({
                term: `Phase ${String(index + 1).padStart(2, '0')}`,
                value: stage,
              }))}
              footnote={equipment.note}
            />
          </Reveal>
        </div>
      </Section>

      {/* 7 — Engineering & Construction Lifecycle (From Lead to Commissioned Plant) */}
      <Section rule labelledBy="lifecycle-heading">
        <SectionIntro
          id="lifecycle-heading"
          title="From technical assessment to an operating mining plant"
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
                <Link href={`/${slug}`} className="group block h-full rounded-xl border border-hairline bg-card p-6 shadow-sm transition-all hover:border-brand-500/40 hover:shadow-md">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-400">
                    {page.eyebrow}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    {page.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                    {page.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-400">
                    Explore technical details
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform duration-ui group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              </RevealItem>
            );
          })}
        </Reveal>
      </Section>

      {/* 8 — Technical Plant Assessment & Optimization Diagnostics */}
      <Section tone="sunken" rule labelledBy="assessment-heading">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20 items-start">
          <Reveal kind="rise">
            <span className="tech-label text-brand-700 dark:text-brand-400">
              System 4 · Technical Plant Assessment &amp; Optimization
            </span>
            <h2
              id="assessment-heading"
              className="mt-2 font-display text-display-md font-bold"
            >
              {assessment.title}
            </h2>
            <p className="measure mt-6 text-base leading-8 text-muted-foreground">
              {assessment.intro}
            </p>

            {/* Diagnostic Photo Card */}
            <div className="mt-6 overflow-hidden rounded-xl border border-hairline bg-card shadow-sm">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                <Image
                  src="/images/mining/gravity-sluice-table.webp"
                  alt="On-site metallurgical recovery inspection and gravity shaking table testing"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    <span className="rounded bg-brand-500/90 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-black">
                      Recovery Audit
                    </span>
                    <p className="mt-1 font-display text-sm font-semibold text-white">
                      Field metallurgical audit &amp; gravity separation diagnostic
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="measure mt-6 text-sm leading-7 text-subtle">
              {assessment.note}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
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
                  Speak to a metallurgical engineer
                </Button>
              </Link>
            </div>
          </Reveal>

          <Reveal kind="wipe" delay={0.06} className="space-y-6">
            <div>
              <h3 className="tech-label">What the assessment evaluates</h3>
              <ScopeRegister
                items={assessment.capabilities}
                columns={1}
                className="mt-4"
              />
            </div>

            <div className="rounded-xl border border-hairline bg-card p-6 shadow-sm">
              <h4 className="font-display text-sm font-bold text-foreground">
                Metallurgical Audit Workflow
              </h4>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                  <span><strong>1. Feed &amp; Grind Profiling:</strong> Sieve particle size analysis (P80) and ball mill power draw.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                  <span><strong>2. Leach &amp; Adsorption Kinetics:</strong> Cyanide consumption curves and carbon loading rates.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                  <span><strong>3. Tailings Recovery Assay:</strong> Residual solid/liquid grade determination to halt gold losses.</span>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 9 — Supporting Engineering & Infrastructure Services */}
      <Section rule labelledBy="supporting-heading">
        <SectionIntro
          id="supporting-heading"
          title="Integrated engineering infrastructure &amp; civil divisions"
          lead="To ensure complete operational reliability on remote mining sites and industrial projects, Green Ngoria maintains qualified in-house divisions for building construction, road civil works, water supply, electrical engineering, and logistics."
          action={
            <Link href="/services">
              <Button
                variant="outline"
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Browse all 10 divisions
              </Button>
            </Link>
          }
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {supportingDivisions.map((division) => {
            const Icon = division.icon;
            return (
              <article
                key={division.title}
                className="group relative flex flex-col justify-between rounded-xl border border-hairline bg-card p-6 shadow-sm transition-all hover:border-brand-500/30 hover:shadow-card"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-secondary/80 text-brand-600 dark:text-brand-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    {division.title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {division.description}
                  </p>
                </div>
                <div className="mt-5 border-t border-hairline pt-3">
                  <Link
                    href={division.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 underline decoration-brand-700/30 transition-colors hover:decoration-brand-700 dark:text-brand-400 dark:decoration-brand-400/30"
                  >
                    View dedicated division page &rarr;
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      {/* 10 — Featured Completed Projects (Bank, Institutional & Building Works) */}
      <Section tone="sunken" rule labelledBy="projects-heading">
        <SectionIntro
          id="projects-heading"
          title="Delivered institutional &amp; civil projects"
          lead="Building refurbishment, structural works, and mechanical packages completed across Rwanda and Burundi for banks, insurers, and international institutions."
          action={
            <Link href="/projects">
              <Button
                variant="outline"
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                See all {company.projects.length} completed projects
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

      {/* 11 — HSE, Sustainability & Quality Assurance */}
      <Section rule labelledBy="hse-heading">
        <SectionIntro
          id="hse-heading"
          title="Safety, environmental containment and quality verification"
          lead={company.hse.summary}
          align="stack"
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal kind="wipe">
            <h3 className="tech-label">Environment, health and safety (EHS)</h3>
            <ScopeRegister
              items={company.hse.points}
              columns={1}
              className="mt-4"
            />
          </Reveal>
          <Reveal kind="wipe" delay={0.06}>
            <h3 className="tech-label">Quality assurance &amp; testing</h3>
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
            Green Ngoria Supplies Limited — Corporate Mining Vision
          </p>
        </Reveal>
      </Section>

      {/* 12 — East Africa Regional Reach */}
      <Section tone="sunken" rule labelledBy="reach-heading">
        <SectionIntro
          id="reach-heading"
          title="Five countries, coordinated from head office in Nairobi"
          lead={`Operating sites in Kenya and Tanzania, completed works across Uganda, Rwanda, and Burundi. Customer Care is available at ${company.customerCare.phone}.`}
          align="stack"
        />
        <RegionalReach className="mt-14" />
      </Section>

      {/* 13 — Client Action CTA */}
      <CtaBanner
        title="Ready to engineer your mining plant or request equipment?"
        body="Submit a technical plant assessment for detailed metallurgical review, or request a line-item quotation for certified processing equipment and installation."
        primary={{
          label: 'Request a plant assessment',
          href: '/technical-assessment',
        }}
        secondary={{
          label: 'Request a quotation (RFQ)',
          href: '/request-rfq',
        }}
      />
    </>
  );
}
