'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Layers,
  Leaf,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { company } from '@/config/company';

const EASE = [0.16, 1, 0.3, 1] as const;

/* ───────────────────── Why Green Ngoria ─────────────────────── */

const differentiators = [
  {
    icon: BadgeCheck,
    title: 'NEMA-approved plant',
    body: 'Nyangoma processing plant licensed under NEMA/PR/SYA/002.',
  },
  {
    icon: Sparkles,
    title: 'Turnkey EPC delivery',
    body: 'One contract from feasibility to commissioned CIP/CIL circuit.',
  },
  {
    icon: ShieldCheck,
    title: 'ISO-aligned quality',
    body: 'Work planned, checked and handed over under ISO 9001 / 14001 / OHSAS 18001.',
  },
  {
    icon: Layers,
    title: 'Ten in-house divisions',
    body: 'Mining, plant, civil, electrical, water, fuel, timber — one point of contact.',
  },
];

export function ValueProps() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {differentiators.map((d) => {
        const Icon = d.icon;
        return (
          <li
            key={d.title}
            className="group relative rounded-2xl border border-hairline bg-card p-6 transition-all duration-500 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-lg"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-secondary/60 text-brand-600 transition-all duration-500 group-hover:border-brand-500/50 group-hover:bg-brand-500/10 dark:text-brand-400">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 font-display text-base font-bold tracking-tight text-foreground">
              {d.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{d.body}</p>
          </li>
        );
      })}
    </ul>
  );
}

/* ───────────────────── What we sell ─────────────────────────── */

const offerings = [
  {
    tag: 'Signature',
    title: 'Turnkey gold processing plants',
    body: 'Feasibility, engineering, civil works, mechanical installation, electrical automation and metallurgical commissioning — as one contract.',
    image: '/images/gallery/ace4116.webp',
    href: '/gold-processing',
    cta: 'Explore plant delivery',
    bullets: ['CIP / CIL circuits', 'Elution & doré pour', 'Tailings management'],
  },
  {
    tag: 'Catalogue',
    title: 'Mining equipment & installation',
    body: 'Certified mills, crushers, screens, cyclones, agitators and pumps — supplied, foundation-cast, aligned and commissioned on site.',
    image: '/images/gallery/greenngoria-10.webp',
    href: '/equipment',
    cta: 'Browse equipment',
    bullets: ['Ball & rod mills', 'Gravity concentrators', 'Pumps & pipework'],
  },
  {
    tag: 'Optimisation',
    title: 'Technical plant assessments',
    body: 'Structured metallurgical audit of an installed circuit — grind, leach kinetics, adsorption, tails — with a written recovery-improvement plan.',
    image: '/images/gallery/ace4063.webp',
    href: '/technical-assessment',
    cta: 'Request an assessment',
    bullets: ['Recovery diagnostics', 'Reagent optimisation', 'Throughput uplift'],
  },
];

export function Offerings() {
  return (
    <ul className="grid gap-6 lg:grid-cols-3">
      {offerings.map((o) => (
        <li
          key={o.title}
          className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-card transition-all duration-500 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-xl"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden">
            <Image
              src={o.image}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />
            <span className="absolute left-4 top-4 rounded-full bg-black/55 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
              {o.tag}
            </span>
          </div>
          <div className="flex flex-1 flex-col p-6">
            <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
              {o.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{o.body}</p>
            <ul className="mt-4 space-y-1.5">
              {o.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                >
                  <span className="h-1 w-1 rounded-full bg-brand-500" />
                  {b}
                </li>
              ))}
            </ul>
            <Link
              href={o.href}
              className="group/cta mt-6 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brand-700 dark:text-brand-400"
            >
              <span className="border-b border-brand-700/30 pb-px transition-colors group-hover/cta:border-brand-700 dark:border-brand-400/30 dark:group-hover/cta:border-brand-400">
                {o.cta}
              </span>
              <ArrowRight
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform duration-500 group-hover/cta:translate-x-1"
              />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ───────────────────── How we deliver (funnel) ──────────────── */

const funnel = [
  {
    step: '01',
    title: 'Enquiry',
    body: 'Submit an RFQ or a brief description of the plant, site or equipment.',
  },
  {
    step: '02',
    title: 'Assessment',
    body: 'Metallurgical review, site visit and scope definition within days.',
  },
  {
    step: '03',
    title: 'Engineering',
    body: 'Process design, drawings, equipment sizing and installation plan.',
  },
  {
    step: '04',
    title: 'Commissioning',
    body: 'Foundation, install, wet-commission, hand-over with recovery targets met.',
  },
];

export function DeliveryFunnel() {
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {funnel.map((f, i) => (
        <li
          key={f.step}
          className="group relative flex h-full flex-col rounded-2xl border border-hairline bg-card p-6 transition-all duration-500 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-400">
              Step {f.step}
            </span>
            {i < funnel.length - 1 && (
              <ArrowRight
                aria-hidden="true"
                className="hidden h-4 w-4 text-muted-foreground transition-colors group-hover:text-brand-500 md:block"
              />
            )}
          </div>
          <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-foreground">
            {f.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.body}</p>
          <div className="mt-6 h-px w-8 bg-brand-500 transition-all duration-500 group-hover:w-full group-hover:bg-brand-500/70" />
        </li>
      ))}
    </ol>
  );
}

/* ───────────────────── Leadership preview ──────────────────── */

export function LeadershipPreview() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {company.leadership.map((leader) => (
        <Link
          key={leader.name}
          href="/leadership"
          className="group block overflow-hidden rounded-2xl border border-hairline bg-card transition-all duration-500 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-lg"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <Image
              src={leader.image}
              alt={leader.name}
              fill
              sizes="(max-width: 640px) 100vw, 25vw"
              className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="font-display text-base font-bold tracking-tight text-white">
                {leader.name}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-white/80">
                {leader.role}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ───────────────────── Certifications strip ─────────────────── */

export function CertificationsStrip() {
  const items = [
    ...company.certifications.map((c) => ({ name: c.name, scope: c.scope })),
    {
      name: 'NEMA/PR/SYA/002',
      scope: 'Nyangoma gold processing plant approval',
    },
    {
      name: 'KRA Tax Compliance',
      scope: 'Available on request during prequalification',
    },
  ];
  return (
    <ul className="flex flex-wrap justify-center gap-3">
      {items.map((c) => (
        <li
          key={c.name}
          className="group flex items-center gap-3 rounded-full border border-hairline bg-card px-4 py-2 transition-all duration-500 hover:-translate-y-0.5 hover:border-brand-500/50 hover:shadow-md"
        >
          <BadgeCheck
            className="h-4 w-4 text-brand-600 dark:text-brand-400"
            aria-hidden="true"
          />
          <div className="text-left">
            <div className="text-xs font-semibold text-foreground">{c.name}</div>
            <div className="text-[0.62rem] leading-tight text-muted-foreground">
              {c.scope}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ───────────────────── Vision quote panel ───────────────────── */

export function VisionPanel() {
  const reduced = useReducedMotion() ?? false;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-white sm:px-14 sm:py-20">
      <div className="absolute inset-0 -z-10 opacity-30">
        <Image
          src="/images/gallery/dji-0318.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40" />
      </div>
      <motion.blockquote
        initial={reduced ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: EASE }}
        className="max-w-3xl font-display text-2xl font-medium leading-[1.35] tracking-tight sm:text-3xl sm:leading-[1.3]"
      >
        <Leaf
          className="mb-6 h-6 w-6 text-brand-400"
          aria-hidden="true"
        />
        &ldquo;{company.vision}&rdquo;
      </motion.blockquote>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link href="/about">
          <Button
            variant="brand"
            size="lg"
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            About Green Ngoria
          </Button>
        </Link>
        <span className="text-xs uppercase tracking-[0.24em] text-white/60">
          Corporate mining vision
        </span>
      </div>
    </div>
  );
}

/* ───────────────────── Contact / RFQ strip ──────────────────── */

export function ContactStrip() {
  return (
    <div className="grid gap-6 rounded-3xl border border-hairline bg-card p-8 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div>
        <h3 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Talk to a qualified engineer today
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Customer Care answers direct on{' '}
          <a
            href={`tel:${company.customerCare.phone.replace(/\s/g, '')}`}
            className="font-semibold text-foreground underline decoration-hairline transition-colors hover:decoration-brand-500"
          >
            {company.customerCare.phone}
          </a>
          {' · '}
          <a
            href={`mailto:${company.customerCare.email}`}
            className="font-semibold text-foreground underline decoration-hairline transition-colors hover:decoration-brand-500"
          >
            {company.customerCare.email}
          </a>
          . RFQs are acknowledged within 24 hours.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/request-rfq">
          <Button
            variant="brand"
            size="lg"
            rightIcon={<ArrowUpRight className="h-4 w-4" />}
          >
            Send an RFQ
          </Button>
        </Link>
        <Link href="/contact">
          <Button
            variant="outline"
            size="lg"
            leftIcon={<Mail className="h-4 w-4" />}
          >
            Contact office
          </Button>
        </Link>
      </div>
    </div>
  );
}
