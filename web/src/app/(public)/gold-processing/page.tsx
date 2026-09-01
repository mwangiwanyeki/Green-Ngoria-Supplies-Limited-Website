import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Gauge,
  MapPin,
  Flame,
  Layers,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/marketing/page-hero';
import { Section, SectionIntro } from '@/components/marketing/section';
import { SpecPanel, ScopeRegister } from '@/components/marketing/spec-panel';
import { ProcessFlowDiagram } from '@/components/marketing/process-flow-diagram';
import { Reveal, RevealItem } from '@/components/marketing/reveal';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { InteractiveEngineeringGallery } from '@/components/marketing/interactive-engineering-gallery';
import { company } from '@/config/company';
import {
  goldCircuitStages,
  goldCircuitDisclaimer,
} from '@/config/gold-circuit';

const title = 'Gold Mining & Mineral Processing Operations';
const description =
  'NEMA-approved gold processing plant at Bondo (Siaya County), alongside producing mining sites in Oyugis, Lolgorian, Taita Taveta, and Tanzania.';

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

const goldOperationsGallery = [
  {
    src: '/images/projects/bondo-gold-processing-plant.webp',
    title: 'Bondo Processing Plant Facility',
    caption:
      'NEMA-approved small-scale gold processing plant (NEMA/PR/SYA/002) at Nyangoma, Bondo featuring ball mills and CIL tank farm.',
    tag: 'Bondo Plant Hub',
  },
  {
    src: '/images/mining/oyugis-gold-mining-site.webp',
    title: 'Oyugis Gold Vein Extraction',
    caption:
      'Active gold quartz vein mining, excavator loading, and gravity concentration sluices in Oyugis, Homa Bay County.',
    tag: 'Oyugis Mining Site',
  },
  {
    src: '/images/mining/lolgorian-gold-mine-shaft.webp',
    title: 'Lolgorian Shaft Headframe',
    caption:
      'Underground quartz reef shaft headframe and ore cart haulage in the historic Lolgorian gold belt (Trans-Mara, Narok County).',
    tag: 'Lolgorian Mining Site',
  },
  {
    src: '/images/mining/ball-mill-installation-bondo.webp',
    title: 'Ball Mill Mechanical Mounting',
    caption:
      'Milling & grinding circuit installation on reinforced concrete plinth at Bondo processing facility.',
    tag: 'Grinding Circuit',
  },
  {
    src: '/images/mining/leach-cil-tank-construction.webp',
    title: 'CIL Leach Agitation Tanks',
    caption:
      'Cyanidation and Carbon-in-Leach tank farm construction with structural baffle frames.',
    tag: 'Leaching Tank Farm',
  },
  {
    src: '/images/mining/centrifugal-concentrators.webp',
    title: 'Knelson Centrifugal Concentrators',
    caption:
      'Centrifugal gravity recovery concentrators staged for free gold separation ahead of cyanidation.',
    tag: 'Gravity Separation',
  },
  {
    src: '/images/mining/poured-dore-bar-bondo.webp',
    title: 'Poured Gold Doré Bullion Bar',
    caption:
      'Refined gold bullion bar smelted and poured directly on site from Bondo processing plant output.',
    tag: 'Doré Bullion',
  },
  {
    src: '/images/mining/gravity-sluice-table.webp',
    title: 'Gravity Shaking Table Circuit',
    caption:
      'Shaking table and gravity sluicing circuit for continuous fine gold recovery testing.',
    tag: 'Metallurgical Audit',
  },
  {
    src: '/images/mining/shaft-hoisting-gear.webp',
    title: 'Shaft Hoisting & Extraction',
    caption:
      'Underground shaft headframe, cable winches, and ore extraction hoisting infrastructure.',
    tag: 'Underground Rig',
  },
];

const plantSpecs = [
  { parameter: 'NEMA Environmental Permit', standardValue: 'Ref: NEMA/PR/SYA/002', engineeringNotes: 'Issued by County Director of Environment, Siaya' },
  { parameter: 'Primary Milling Circuit', standardValue: 'Continuous Wet Ball Mill on reinforced plinth', engineeringNotes: 'Closed-circuit with hydrocyclone classification' },
  { parameter: 'Target Grind Particle Size (P80)', standardValue: '74 µm (80% passing 200 mesh)', engineeringNotes: 'Ensures maximum gold liberation from quartz host rock' },
  { parameter: 'Leaching & Adsorption System', standardValue: 'Carbon-in-Leach (CIL) / CIP Agitation Tanks', engineeringNotes: 'Multi-stage continuous counter-current carbon movement' },
  { parameter: 'Gravity Concentration Efficiency', standardValue: 'Single-pass Knelson / Sluice recovery', engineeringNotes: 'Captures coarse free gold prior to cyanidation' },
  { parameter: 'Doré Smelting Induction Furnace', standardValue: 'High-frequency electric induction smelt', engineeringNotes: 'Produces 90%–96% pure gold doré bullion bars' },
  { parameter: 'Tailings & Environmental Management', standardValue: 'Zero untreated effluent discharge', engineeringNotes: 'HDPE-lined tailings storage with cyanide neutralization' },
];

export default function GoldProcessingPage() {
  return (
    <>
      {/* 1 — Page Hero */}
      <PageHero
        title="Gold Mining & Mineral Processing Operations"
        lead={[
          'Green Ngoria operates active gold mining concessions in Bondo, Oyugis, Lolgorian, and Taita Taveta in Kenya, alongside established mining assets in Tanzania.',
          'At the centre of our Kenyan mineral processing operations is a small-scale gold processing plant at Nyangoma, Bondo Sub-County, fully approved by the National Environment Management Authority (NEMA/PR/SYA/002).',
        ]}
        primaryAction={{ label: 'Discuss mining partnership', href: '/contact' }}
        secondaryAction={{
          label: 'Explore equipment catalogue',
          href: '/equipment',
        }}
        facts={[
          { term: 'Processing Facility', value: 'Bondo CIP/CIL Gold Plant' },
          { term: 'Operating Sites', value: 'Bondo · Oyugis · Lolgorian · Taita' },
          { term: 'Approval Reference', value: 'NEMA/PR/SYA/002' },
          { term: 'Statutory Status', value: 'Stamp Duty Paid & County Permitted' },
        ]}
      />

      {/* 2 — Primary Facility Feature Visual */}
      <section className="relative -mt-10 border-b border-hairline bg-surface-sunken pb-12 pt-0 sm:-mt-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-panel">
            <div className="relative aspect-[21/9] w-full min-h-[300px] bg-muted sm:min-h-[400px]">
              <Image
                src="/images/projects/bondo-gold-processing-plant.webp"
                alt="NEMA-approved gold processing plant facility at Bondo, Siaya County"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-4 sm:bottom-6 sm:left-8 sm:right-8">
                <div className="max-w-2xl">
                  <span className="rounded-md bg-brand-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black backdrop-blur-md">
                    NEMA Approved Processing Plant
                  </span>
                  <h2 className="mt-2 font-display text-lg font-bold text-white sm:text-2xl">
                    Bondo Gold Processing Facility — Plot Nyangoma/1352
                  </h2>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/80 sm:text-sm">
                    Complete closed-circuit crushing, ball milling, centrifugal gravity concentration, and CIL carbon agitation tank farm.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href="/technical-assessment">
                    <Button variant="brand" size="sm">
                      Request Plant Assessment
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 — Regulatory Datasheet & Operating Structure */}
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
                {plant.description} The site is located on Plot L.R. No. Nyangoma/1352 in
                Bondo Sub-County, Siaya County.
              </p>
              <p>
                Production at the plant is directed by qualified resident metallurgists and mining engineers. Work on the site is carried out under the Green
                Ngoria Environment, Health and Safety (EHS) policy, which gives
                environmental protection and workforce safety priority in every operation.
              </p>
              <p>
                Environmental performance is an operational prerequisite: our processing philosophy incorporates lined containment bunds, strict cyanide detoxification circuits, and zero hazardous discharge into surrounding waterways.
              </p>
            </div>
          </Reveal>

          <Reveal kind="rise" delay={0.08}>
            <SpecPanel
              tone="accent"
              title="Regulatory & Licensing Register"
              rows={[
                { term: 'Facility Name', value: plant.name },
                { term: 'Concession Location', value: plant.location },
                {
                  term: 'NEMA Approval Ref',
                  value: plant.approval,
                  mono: true,
                },
                { term: 'Approving Authority', value: plant.approvalBody },
                {
                  term: 'Mining Licences',
                  value: 'Stamp duty on mining licences paid 29 October 2019',
                },
                {
                  term: 'County Operating Permit',
                  value:
                    'Single Business Permit issued by County Government of Siaya',
                },
              ]}
              footnote="Copies of statutory NEMA approvals, mining licences, and county permits are maintained on file for investor prequalification."
            />
          </Reveal>
        </div>
      </Section>

      {/* 4 — High-Resolution Field Photography Gallery */}
      <Section tone="sunken" rule labelledBy="plant-gallery-heading">
        <InteractiveEngineeringGallery
          items={goldOperationsGallery.map((item) => ({
            src: item.src,
            alt: item.title,
            title: item.title,
            description: item.caption,
            tag: item.tag,
          }))}
          headline="Gold Mining Sites &amp; Processing Field Records"
          subhead="Authentic high-resolution photographic records from Bondo, Oyugis, and Lolgorian mining sites. Click any photograph to zoom up to 2.5x with full pixel clarity."
        />
      </Section>

      {/* 5 — Operating Mining Concessions (Visual Cards) */}
      <Section rule labelledBy="sites-heading">
        <SectionIntro
          id="sites-heading"
          title="Active Mining Sites &amp; Concessions"
          lead="Operating gold extraction sites across western Kenya, the Rift Valley corridor, the Mozambique belt, and Tanzania."
          align="stack"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {company.operations.miningSites.map((site) => (
            <div
              key={site.name}
              className="group overflow-hidden rounded-2xl border border-hairline bg-card shadow-card transition-all duration-ui hover:border-brand-500/50 hover:shadow-panel"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                {site.image && (
                  <Image
                    src={site.image}
                    alt={site.name}
                    fill
                    className="object-cover transition-transform duration-emphasis ease-out-expo group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="rounded bg-brand-500/90 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-black">
                    {site.commodity}
                  </span>
                  <h3 className="mt-1 font-display text-base font-bold text-white">
                    {site.name}
                  </h3>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {site.country} Concession
                </div>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {site.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 6 — CIP / CIL 7-Stage Interactive Flowsheet */}
      <Section tone="sunken" rule labelledBy="circuit-heading">
        <SectionIntro
          id="circuit-heading"
          title="Carbon-in-Pulp (CIP) &amp; Carbon-in-Leach (CIL) Process Flow"
          lead="From Run-of-Mine ore through crushing, fine milling, cyanidation, carbon adsorption, elution, and bullion smelting. Select a stage to examine mechanical functions and operating parameters."
          align="stack"
        />
        <ProcessFlowDiagram
          className="mt-14"
          stages={goldCircuitStages}
          initialStageId="adsorption"
          disclaimer={goldCircuitDisclaimer}
        />
      </Section>

      {/* 7 — Plant Design Criteria & Operating Specifications Table */}
      <Section rule labelledBy="specs-heading">
        <SectionIntro
          id="specs-heading"
          title="Plant Design Criteria &amp; Operating Tolerances"
          lead="Technical specifications for Green Ngoria gold mineral processing facilities."
          align="stack"
        />

        <div className="mt-10 overflow-hidden rounded-2xl border border-hairline bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-hairline bg-secondary/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-4">Circuit Stage / Parameter</th>
                  <th scope="col" className="px-6 py-4">Standard Design Criteria</th>
                  <th scope="col" className="px-6 py-4">Operational &amp; Engineering Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {plantSpecs.map((spec) => (
                  <tr key={spec.parameter} className="transition-colors hover:bg-accent/40">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {spec.parameter}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-brand-700 dark:text-brand-400">
                      {spec.standardValue}
                    </td>
                    <td className="px-6 py-4 text-xs leading-5 text-muted-foreground">
                      {spec.engineeringNotes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* 8 — In-House Mechanical & Electrical Engineering Support */}
      <Section tone="sunken" rule labelledBy="machinery-heading">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal kind="rise">
            <h2
              id="machinery-heading"
              className="font-display text-display-md font-bold"
            >
              In-House Mechanical &amp; Electrical Engineering Support
            </h2>
            <div className="measure mt-6 space-y-5 text-base leading-8 text-muted-foreground">
              <p>
                Green Ngoria maintains permanent in-house mechanical and electrical engineering departments to design, erect, and maintain heavy mining equipment.
              </p>
              <p>
                Our engineering teams manage heavy crane rigging, precision shaft laser alignment, motor control centers (MCC), and emergency spare parts replacement to guarantee high plant availability and minimum downtime.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/services/mechanical">
                <Button variant="outline">Mechanical Division</Button>
              </Link>
              <Link href="/services/electrical-services">
                <Button variant="outline">Electrical Division</Button>
              </Link>
              <Link href="/equipment">
                <Button variant="brand">Browse Mining Machinery</Button>
              </Link>
            </div>
          </Reveal>

          <Reveal kind="wipe" delay={0.06}>
            <h3 className="tech-label">
              Environment, Health and Safety Standards
            </h3>
            <ScopeRegister
              items={company.hse.points}
              columns={1}
              className="mt-4"
            />
          </Reveal>
        </div>
      </Section>

      {/* 9 — Frequently Answered Questions */}
      <Section rule labelledBy="faq-heading">
        <SectionIntro
          id="faq-heading"
          title="Gold Processing &amp; Mining Operations FAQs"
          lead="Direct guidance regarding site partnerships, environmental permits, and processing plant capabilities."
          align="stack"
        />

        <div className="mx-auto mt-10 max-w-4xl space-y-4">
          {[
            {
              question: 'Where are Green Ngoria’s primary gold mining and extraction sites located?',
              answer:
                'Our primary gold mining operations are situated in Bondo (Siaya County), Oyugis (Homa Bay County), Lolgorian (Narok County / Trans-Mara), and Taita Taveta in Kenya, alongside mineral concessions in Tanzania.',
            },
            {
              question: 'What is the processing capacity of the Bondo gold plant?',
              answer:
                'The Bondo plant is configured for modular expansion, featuring closed-circuit ball milling, Knelson gravity separation, and continuous CIL agitation leaching with automated gold room electrowinning and bullion smelting.',
            },
            {
              question: 'Does Green Ngoria accept custom ore feed or contract milling for third-party mining operators?',
              answer:
                'Yes. We offer toll-milling and contract mineral processing arrangements for qualified artisanal and small-scale miners with verified head grades and licensing provenance.',
            },
          ].map((faq) => (
            <div
              key={faq.question}
              className="rounded-xl border border-hairline bg-card p-6 shadow-sm"
            >
              <h3 className="flex items-start gap-3 font-display text-base font-bold text-foreground">
                <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
                <span>{faq.question}</span>
              </h3>
              <p className="mt-3 pl-8 text-sm leading-7 text-muted-foreground">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 10 — Action Banner */}
      <CtaBanner
        title="Partner with Green Ngoria in Gold Mining & Processing"
        body="For joint-venture mining opportunities, concession development, equipment supply, or toll milling enquiries, contact our managing director's office in Nairobi."
        primary={{ label: 'Contact Managing Director Office', href: '/contact' }}
        secondary={{
          label: 'Request Plant Assessment',
          href: '/technical-assessment',
        }}
      />
    </>
  );
}
