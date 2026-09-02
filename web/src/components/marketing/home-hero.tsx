'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlantSchematic } from '@/components/marketing/plant-schematic';
import { HeroBackdrop } from '@/components/marketing/hero-backdrop';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Home hero. The authored moment is a focus-pull: the schematic resolves from
 * blur while the headline settles. Reduced motion renders the final state.
 */
export function HomeHero({
  countries,
  disciplines,
}: {
  countries: string[];
  disciplines: string[];
}) {
  const reduced = useReducedMotion() ?? false;

  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, ease: EASE, delay },
        };

  return (
    <section className="surface-ink on-ink texture-grain relative overflow-hidden">
      <HeroBackdrop />
      <div className="linework pointer-events-none absolute inset-0 opacity-40" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-[-14rem] h-[42rem] w-[42rem] rounded-full bg-brand-500/[0.14] blur-[140px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[hsl(var(--ink))]"
      />

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-36 lg:px-10 lg:pb-24 lg:pt-44">
        <div className="grid items-center gap-14 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-10 lg:gap-20">
          <div>
            <motion.div {...rise(0)} className="mb-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-300 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
                Mining · CIP/CIL Processing Plants · Equipment Installation
              </span>
            </motion.div>

            <motion.h1
              {...rise(0.04)}
              className="max-w-[16ch] font-display text-display-2xl font-extrabold text-[hsl(var(--on-ink))]"
            >
              Gold mining, processing plant engineering &amp; equipment installation.
            </motion.h1>

            <motion.p
              {...rise(0.1)}
              className="measure mt-6 text-lg leading-8 text-[hsl(var(--on-ink-muted))]"
            >
              Green Ngoria operates producing gold concessions in Bondo (Siaya)
              and Taita Taveta, constructs NEMA-approved Carbon-in-Pulp (CIP) and
              Carbon-in-Leach (CIL) mineral processing plants, and installs heavy
              mining machinery across Kenya, Tanzania, and East Africa.
            </motion.p>

            <motion.div
              {...rise(0.16)}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link href="/technical-assessment" className="sm:w-auto">
                <Button
                  variant="brand"
                  size="xl"
                  className="w-full sm:w-auto font-semibold"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Request plant assessment
                </Button>
              </Link>
              <Link href="/gold-processing" className="sm:w-auto">
                <Button size="xl" variant="on-ink" className="w-full sm:w-auto">
                  Gold processing plant
                </Button>
              </Link>
              <Link href="/equipment" className="sm:w-auto">
                <Button
                  size="xl"
                  variant="ghost"
                  className="w-full sm:w-auto text-white/80 hover:text-white hover:bg-white/10"
                >
                  Mining equipment &rarr;
                </Button>
              </Link>
            </motion.div>

            <motion.dl
              {...rise(0.22)}
              className="mt-12 grid max-w-xl grid-cols-2 gap-x-8 gap-y-6 border-t border-white/10 pt-6 sm:grid-cols-3"
            >
              <div>
                <dt className="tech-label text-[hsl(var(--on-ink-subtle))]">
                  Plant Approval
                </dt>
                <dd className="mt-1.5 font-mono text-xs font-semibold text-white">
                  NEMA/PR/SYA/002
                </dd>
              </div>
              <div>
                <dt className="tech-label text-[hsl(var(--on-ink-subtle))]">
                  Mining Sites
                </dt>
                <dd className="mt-1.5 text-xs font-medium text-[hsl(var(--on-ink-muted))]">
                  Bondo &amp; Taita Taveta
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="tech-label text-[hsl(var(--on-ink-subtle))]">
                  Plant Delivery
                </dt>
                <dd className="mt-1.5 text-xs font-medium text-[hsl(var(--on-ink-muted))]">
                  Turnkey EPC / CIP-CIL
                </dd>
              </div>
            </motion.dl>
          </div>

          <motion.div
            aria-hidden="true"
            initial={reduced ? false : { opacity: 0, filter: 'blur(14px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
            className="relative hidden aspect-[520/560] text-[hsl(var(--on-ink))] md:block"
          >
            <PlantSchematic />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
