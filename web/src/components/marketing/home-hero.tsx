'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlantSchematic } from '@/components/marketing/plant-schematic';

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
      <div className="linework pointer-events-none absolute inset-0 opacity-70" />
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
            <motion.h1
              {...rise(0)}
              className="max-w-[16ch] font-display text-display-2xl font-extrabold text-[hsl(var(--on-ink))]"
            >
              Mining, mineral processing and the plants that make them work.
            </motion.h1>

            <motion.p
              {...rise(0.08)}
              className="measure mt-8 text-lg leading-8 text-[hsl(var(--on-ink-muted))]"
            >
              Green Ngoria mines gold and gemstones in Kenya and Tanzania, runs
              a NEMA-approved gold processing plant at Bondo, and delivers the
              civil, mechanical and electrical engineering that producing sites
              depend on.
            </motion.p>

            <motion.div
              {...rise(0.16)}
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link href="/technical-assessment" className="sm:w-auto">
                <Button
                  variant="brand"
                  size="xl"
                  className="w-full sm:w-auto"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Request a plant assessment
                </Button>
              </Link>
              <Link href="/contact" className="sm:w-auto">
                <Button size="xl" variant="on-ink" className="w-full sm:w-auto">
                  Discuss a mining project
                </Button>
              </Link>
            </motion.div>

            <motion.dl
              {...rise(0.24)}
              className="mt-14 grid max-w-xl gap-x-10 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-2"
            >
              <div>
                <dt className="tech-label text-[hsl(var(--on-ink-subtle))]">
                  Operating countries
                </dt>
                <dd className="mt-2 text-sm leading-6 text-[hsl(var(--on-ink-muted))]">
                  {countries.join(' · ')}
                </dd>
              </div>
              <div>
                <dt className="tech-label text-[hsl(var(--on-ink-subtle))]">
                  In-house disciplines
                </dt>
                <dd className="mt-2 text-sm leading-6 text-[hsl(var(--on-ink-muted))]">
                  {disciplines.join(' · ')}
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
