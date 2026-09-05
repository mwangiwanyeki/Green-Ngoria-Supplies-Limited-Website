import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Route,
  Droplets,
  Zap,
  Fuel,
  TreePine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrganizationJsonLd } from '@/components/marketing/organization-jsonld';
import { GoldPlantFaqJsonLd } from '@/components/marketing/gold-plant-faq-jsonld';
import { HomeHero } from '@/components/marketing/home-hero';
import { TrustStrip } from '@/components/marketing/trust-strip';
import { Section, SectionIntro } from '@/components/marketing/section';
import { Reveal, RevealItem } from '@/components/marketing/reveal';
import {
  CapabilityTiles,
  GalleryPeek,
  Metrics,
} from '@/components/marketing/home-showcase';
import {
  CertificationsStrip,
  ContactStrip,
  DeliveryFunnel,
  LeadershipPreview,
  Offerings,
  ValueProps,
  VisionPanel,
} from '@/components/marketing/home-marketing';
import { ProcessFlowDiagram } from '@/components/marketing/process-flow-diagram';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { company } from '@/config/company';
import {
  goldCircuitStages,
  goldCircuitDisclaimer,
} from '@/config/gold-circuit';

const description =
  'Green Ngoria Supplies Limited: gold mining concessions in Bondo (Siaya) and Taita Taveta, NEMA-approved turnkey CIP/CIL gold processing plants, precision equipment installation, and multi-disciplinary engineering across Kenya, Tanzania and East Africa.';

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
    'Mining EPC Kenya Tanzania',
  ],
  authors: [{ name: 'Green Ngoria Supplies Limited' }],
  alternates: { canonical: '/' },
  openGraph: {
    title:
      'Gold Mining, CIP/CIL Processing Plants & Equipment Installation | Green Ngoria Supplies Limited',
    description,
    type: 'website',
    url: '/',
    siteName: company.legalName,
    images: [
      {
        url: '/images/gallery/dji-0333.webp',
        width: 1200,
        height: 630,
        alt: 'Aerial view of the Green Ngoria Bondo gold processing plant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Gold Mining, CIP/CIL Processing Plants & Equipment Installation | Green Ngoria',
    description,
    images: ['/images/gallery/dji-0333.webp'],
  },
};

const supportingDivisions = [
  {
    title: 'Building works & infrastructure',
    href: '/services/building-works',
    icon: Building2,
  },
  {
    title: 'Mine access roads & civil earthworks',
    href: '/services/road-construction',
    icon: Route,
  },
  {
    title: 'Industrial water & reticulation',
    href: '/services/water-projects',
    icon: Droplets,
  },
  {
    title: 'Electrical & automation',
    href: '/services/electrical-services',
    icon: Zap,
  },
  {
    title: 'Fuel logistics & energy',
    href: '/services/oil-and-petroleum',
    icon: Fuel,
  },
  {
    title: 'Timber & structural shoring',
    href: '/services/timber-importation',
    icon: TreePine,
  },
];

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />
      <GoldPlantFaqJsonLd />

      {/* 1 — Full-bleed editorial hero */}
      <HomeHero />

      {/* 2 — Trust strip */}
      <TrustStrip />

      {/* 3a — Why Green Ngoria (value proposition) */}
      <Section labelledBy="why-heading">
        <SectionIntro
          id="why-heading"
          title="Why clients choose Green Ngoria"
          lead="Four things that make the difference on a producing mine site."
          align="stack"
        />
        <div className="mt-12">
          <ValueProps />
        </div>
      </Section>

      {/* 3b — Capability tiles (bento) */}
      <Section tone="sunken" rule labelledBy="capabilities-heading">
        <SectionIntro
          id="capabilities-heading"
          title="From deposit to poured bullion"
          lead="Five disciplines under one roof — mining, processing, equipment, optimisation and delivery."
          align="stack"
        />
        <div className="mt-12">
          <CapabilityTiles />
        </div>
      </Section>

      {/* 3c — What we sell (products & services showcase) */}
      <Section rule labelledBy="offerings-heading">
        <SectionIntro
          id="offerings-heading"
          title="What we sell"
          lead="Turnkey plants, certified equipment and independent optimisation — priced line-item, delivered as one contract."
          action={
            <Link href="/services">
              <Button
                variant="outline"
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Full services catalogue
              </Button>
            </Link>
          }
        />
        <div className="mt-12">
          <Offerings />
        </div>
      </Section>

      {/* 4 — Editorial: The Bondo plant */}
      <Section tone="sunken" rule labelledBy="bondo-heading">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal
            kind="rise"
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-hairline"
          >
            <Image
              src="/images/gallery/greenngoria-01.webp"
              alt="The Bondo NEMA-approved gold processing plant"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <span className="rounded-full bg-black/55 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                NEMA/PR/SYA/002 · Nyangoma, Bondo
              </span>
            </div>
          </Reveal>
          <Reveal kind="rise" delay={0.06}>
            <h2
              id="bondo-heading"
              className="font-display text-display-md font-bold tracking-tight sm:text-display-lg"
            >
              A working gold plant.
              <span className="block text-brand-600 dark:text-brand-400">
                Not a rendered one.
              </span>
            </h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground">
              Green Ngoria&rsquo;s Bondo site operates a licensed small-scale
              CIP circuit — leach, adsorption, elution and doré. Every
              photograph on this site is from that plant, or one we&rsquo;ve
              built.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/gold-processing">
                <Button
                  variant="brand"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Explore the plant
                </Button>
              </Link>
              <Link href="/certifications">
                <Button variant="outline">Licensing &amp; permits</Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 5 — Numbers strip */}
      <Section labelledBy="numbers-heading">
        <SectionIntro
          id="numbers-heading"
          title="By the numbers"
          align="stack"
        />
        <div className="mt-12">
          <Metrics
            items={[
              { value: '5', label: 'East-African countries', hint: 'KE · TZ · UG · RW · BI' },
              { value: '2', label: 'Producing mines', hint: 'Bondo & Taita Taveta' },
              { value: '10', label: 'Engineering divisions', hint: 'Mining · plant · civil · electrical · logistics' },
              { value: '7', label: 'Stage CIP/CIL circuit', hint: 'Ore to doré' },
            ]}
          />
        </div>
      </Section>

      {/* 5b — How we deliver (4-step sales funnel) */}
      <Section rule labelledBy="funnel-heading">
        <SectionIntro
          id="funnel-heading"
          title="How we deliver"
          lead="From first enquiry to a plant producing doré — four steps, one team."
          align="stack"
        />
        <div className="mt-12">
          <DeliveryFunnel />
        </div>
      </Section>

      {/* 6 — Process circuit */}
      <Section tone="sunken" rule labelledBy="circuit-heading">
        <SectionIntro
          id="circuit-heading"
          title="Ore to doré, in seven stages"
          lead="Select any stage to inspect its equipment scope and metallurgy."
          action={
            <Link href="/gold-processing">
              <Button
                variant="brand"
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Full plant walkthrough
              </Button>
            </Link>
          }
        />
        <ProcessFlowDiagram
          className="mt-12"
          stages={goldCircuitStages}
          initialStageId="adsorption"
          disclaimer={goldCircuitDisclaimer}
        />
      </Section>

      {/* 7 — Gallery peek */}
      <Section rule labelledBy="gallery-heading">
        <SectionIntro
          id="gallery-heading"
          title="On site with Green Ngoria"
          lead="A visual record from our mines, plants and installations."
          action={
            <Link href="/gallery">
              <Button
                variant="outline"
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                View full gallery
              </Button>
            </Link>
          }
        />
        <div className="mt-12">
          <GalleryPeek />
        </div>
      </Section>

      {/* 8 — Divisions (bento) */}
      <Section tone="sunken" rule labelledBy="divisions-heading">
        <SectionIntro
          id="divisions-heading"
          title="Ten in-house divisions"
          lead="On remote mining sites, single-source delivery keeps the plant running."
          action={
            <Link href="/services">
              <Button
                variant="outline"
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Browse all divisions
              </Button>
            </Link>
          }
        />
        <Reveal
          kind="draw"
          as="ul"
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {supportingDivisions.map((d) => {
            const Icon = d.icon;
            return (
              <RevealItem key={d.title} as="li">
                <Link
                  href={d.href}
                  className="group relative flex h-full items-center gap-4 overflow-hidden rounded-2xl border border-hairline bg-card p-5 transition-all duration-500 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-xl"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-hairline bg-secondary/70 text-brand-600 transition-colors duration-500 group-hover:border-brand-500/40 group-hover:bg-brand-500/10 dark:text-brand-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="min-w-0 flex-1 font-display text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-brand-700 dark:group-hover:text-brand-400">
                    {d.title}
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400" />
                </Link>
              </RevealItem>
            );
          })}
        </Reveal>
      </Section>

      {/* 8b — Leadership */}
      <Section rule labelledBy="leadership-heading">
        <SectionIntro
          id="leadership-heading"
          title="The people directing the company"
          lead="Board and executive management — accessible, accountable, on the ground."
          action={
            <Link href="/leadership">
              <Button
                variant="outline"
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Full leadership profiles
              </Button>
            </Link>
          }
        />
        <div className="mt-12">
          <LeadershipPreview />
        </div>
      </Section>

      {/* 8c — Certifications strip */}
      <Section tone="sunken" rule labelledBy="cert-heading">
        <SectionIntro
          id="cert-heading"
          title="Certified, licensed, compliant"
          lead="Prequalification-ready documentation available on request."
          align="stack"
        />
        <div className="mt-12">
          <CertificationsStrip />
        </div>
      </Section>

      {/* 8d — Vision panel */}
      <Section labelledBy="vision-heading">
        <h2 id="vision-heading" className="sr-only">
          Corporate mining vision
        </h2>
        <VisionPanel />
      </Section>

      {/* 8e — Direct contact strip */}
      <Section tone="sunken" labelledBy="contact-heading">
        <h2 id="contact-heading" className="sr-only">
          Talk to Green Ngoria
        </h2>
        <ContactStrip />
      </Section>

      {/* 9 — Final CTA */}
      <CtaBanner
        title="Engineer your next plant with us"
        body="A metallurgical review, or a line-item quote for equipment and installation. We&rsquo;ll respond within 48 hours."
        primary={{
          label: 'Request a plant assessment',
          href: '/technical-assessment',
        }}
        secondary={{ label: 'Send an RFQ', href: '/request-rfq' }}
      />
    </>
  );
}
