'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Pickaxe,
  Factory,
  Wrench,
  Gauge,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Reveal, RevealItem } from '@/components/marketing/reveal';
import { Button } from '@/components/ui/button';

export interface GoldPillar {
  id: string;
  title: string;
  badge: string;
  headline: string;
  description: string;
  icon: typeof Pickaxe;
  image: string;
  imageAlt: string;
  highlights: string[];
  href: string;
  ctaText: string;
}

const goldPillars: GoldPillar[] = [
  {
    id: 'gold-mining',
    title: 'Gold Mining & Extraction',
    badge: 'Mining Operations',
    headline: 'Active gold concessions in Kenya and Tanzania',
    description:
      'Direct owner and operator of active gold mining operations in Bondo (Siaya County) and Taita Taveta in Kenya, alongside established mining interests in Tanzania. We conduct geological sampling, pit planning, shaft sinking, and high-grade vein mining under strict statutory compliance.',
    icon: Pickaxe,
    image: '/images/mining/poured-dore-bar-bondo.webp',
    imageAlt: 'Poured gold doré bar at Green Ngoria Bondo gold operation',
    highlights: [
      'Active sites in Bondo (Siaya) & Taita Taveta',
      'Mining licences held with stamp duty paid',
      'Vein mining, ore extraction & sorting',
      'Zero-compromise EHS & community stewardship',
    ],
    href: '/services/gold-mining',
    ctaText: 'Explore gold mining operations',
  },
  {
    id: 'plant-construction',
    title: 'Gold Processing Plant Construction',
    badge: 'Turnkey EPC Delivery',
    headline: 'NEMA-approved CIP, CIL and gravity concentration plants',
    description:
      'Full engineering, procurement, fabrication, civil erection, and commissioning of gold mineral processing facilities. We build modern Carbon-in-Pulp (CIP) and Carbon-in-Leach (CIL) plants engineered for high recovery yields from complex refractory and oxide ores.',
    icon: Factory,
    image: '/images/projects/bondo-gold-processing-plant.webp',
    imageAlt: 'NEMA-approved gold processing plant construction at Bondo',
    highlights: [
      'NEMA Approved: Ref NEMA/PR/SYA/002',
      'Complete CIL / CIP agitation tank farm erection',
      'Desorption, elution column & electrowinning cells',
      'Cyanide detoxification & environmental containment',
    ],
    href: '/gold-processing',
    ctaText: 'View gold plant engineering',
  },
  {
    id: 'equipment-installation',
    title: 'Mining Equipment Supply & Installation',
    badge: 'Heavy Plant Machinery',
    headline: 'Precision mechanical alignment and turnkey commissioning',
    description:
      'Supplying and installing certified gold processing machinery. From primary jaw crushers and ball mills to Knelson gravity concentrators, slurry pumps, and bullion smelting induction furnaces — installed by qualified mechanical and electrical engineers.',
    icon: Wrench,
    image: '/images/mining/ball-mill-installation-bondo.webp',
    imageAlt:
      'Ball mill grinding machinery installation and precision mechanical mounting on reinforced plinth at Bondo site',
    highlights: [
      'Primary/secondary jaw & cone crushers',
      'Ball mills, cyclone clusters & classification',
      'Interstage carbon screens & slurry pumps',
      'Gold smelting furnaces & bullion pour tables',
    ],
    href: '/equipment',
    ctaText: 'Browse equipment & request RFQ',
  },
  {
    id: 'plant-optimization',
    title: 'Plant Optimization & Recovery Audit',
    badge: 'Metallurgical Diagnostics',
    headline: 'Diagnose bottlenecks and unlock maximum gold recovery',
    description:
      'Targeted metallurgical and operational reviews for existing mineral processing plants. We analyze grinding classification, leach kinetics, carbon activity, slurry viscosity, and reagent consumption to resolve bottlenecks and increase throughput.',
    icon: Gauge,
    image: '/images/mining/gravity-sluice-table.webp',
    imageAlt:
      'Engineers and technicians conducting metallurgical recovery audit and gravity concentration testing on operating circuit',
    highlights: [
      'Grind size & hydrocyclone efficiency review',
      'Cyanide leaching kinetics & carbon load testing',
      'Tailings grade analysis & loss minimization',
      'Prioritized engineering optimization roadmap',
    ],
    href: '/plant-optimization',
    ctaText: 'Request a plant audit',
  },
];

export function GoldCapabilitiesGrid() {
  return (
    <div className="space-y-12">
      <Reveal
        kind="draw"
        as="div"
        className="grid gap-8 md:grid-cols-2 lg:gap-10"
      >
        {goldPillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <RevealItem key={pillar.id} as="div" className="h-full">
              <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-hairline bg-card p-6 shadow-card transition-all duration-ui hover:border-brand-500/40 hover:shadow-panel lg:p-8">
                {/* Visual accent top line */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-600 via-amber-500 to-brand-600 opacity-0 transition-opacity duration-ui group-hover:opacity-100"
                />

                <div>
                  {/* Media / thumbnail header */}
                  <div className="relative mb-6 aspect-[16/9] w-full overflow-hidden rounded-xl border border-hairline bg-muted">
                    <Image
                      src={pillar.image}
                      alt={pillar.imageAlt}
                      fill
                      className="object-cover transition-transform duration-emphasis ease-out-expo group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                        <Icon className="h-3.5 w-3.5 text-brand-400" />
                        {pillar.badge}
                      </span>
                      <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-white/90">
                        Pillar 0{idx + 1}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    {pillar.title}
                  </h3>
                  <p className="mt-1.5 text-sm font-semibold text-brand-700 dark:text-brand-400">
                    {pillar.headline}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {pillar.description}
                  </p>

                  {/* Highlights list */}
                  <ul className="mt-5 space-y-2 border-t border-hairline pt-4">
                    {pillar.highlights.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2.5 text-xs font-medium text-foreground/90"
                      >
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer action link */}
                <div className="mt-6 border-t border-hairline pt-4">
                  <Link
                    href={pillar.href}
                    className="group/link inline-flex items-center gap-2 text-sm font-semibold text-brand-600 underline decoration-brand-600/30 underline-offset-4 transition-colors hover:decoration-brand-600 dark:text-brand-400 dark:decoration-brand-400/30 dark:hover:decoration-brand-400"
                  >
                    <span>{pillar.ctaText}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-ui group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </article>
            </RevealItem>
          );
        })}
      </Reveal>

      {/* Bottom Technical Callout */}
      <div className="rounded-xl border border-brand-500/20 bg-brand-500/[0.04] p-6 lg:p-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 p-2.5 text-brand-600 dark:text-brand-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-display text-base font-bold text-foreground">
                Turnkey Engineering, Procurement & Construction (EPC)
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Every mining plant and equipment installation is led by qualified
                process, civil, mechanical, and electrical engineers adhering to
                ISO 9001 and ISO 14001 quality and environmental frameworks.
              </p>
            </div>
          </div>
          <Link href="/technical-assessment" className="shrink-0">
            <Button variant="brand" size="sm">
              Request a Plant Assessment
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
