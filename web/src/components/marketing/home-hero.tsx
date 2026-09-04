'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Full-bleed editorial hero. One photograph, one headline, one action.
 * Photograph rotates slowly (Ken-Burns) behind soft ink veil; text rises
 * on entrance and settles.
 */
export function HomeHero() {
  const reduced = useReducedMotion() ?? false;

  const rise = (delay = 0) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: EASE, delay },
        };

  return (
    <section className="relative isolate overflow-hidden bg-black text-white">
      {/* Background photograph with slow Ken Burns drift. */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          initial={reduced ? false : { scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 18, ease: 'easeOut' }}
          className="relative h-full w-full"
        >
          <Image
            src="/images/gallery/dji-0333.webp"
            alt="Aerial view of the Green Ngoria Bondo gold processing plant"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
        {/* Veil for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_60%,rgba(0,0,0,0.65)_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-between px-5 pt-32 pb-10 sm:px-8 sm:pt-40 sm:pb-14 lg:px-10">
        <div className="flex-1 flex flex-col justify-center">
          <motion.span
            {...rise(0)}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
            Bondo · Taita Taveta · Nairobi
          </motion.span>

          <motion.h1
            {...rise(0.06)}
            className="mt-6 max-w-[16ch] font-display text-[2.75rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl md:text-7xl lg:text-[5.25rem]"
          >
            Gold, engineered
            <span className="block text-brand-400">end&#8209;to&#8209;end.</span>
          </motion.h1>

          <motion.p
            {...rise(0.14)}
            className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg"
          >
            Producing mines, NEMA-approved CIP/CIL processing plants, and turnkey
            equipment installation across Kenya, Tanzania and East Africa.
          </motion.p>

          <motion.div
            {...rise(0.22)}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link href="/technical-assessment">
              <Button
                variant="brand"
                size="xl"
                className="font-semibold shadow-2xl shadow-brand-500/20 transition-transform duration-300 hover:-translate-y-0.5"
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Request a plant assessment
              </Button>
            </Link>
            <Link
              href="/gold-processing"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-white/85 transition-colors hover:text-white"
            >
              <span className="border-b border-white/30 pb-0.5 transition-colors group-hover:border-white">
                Explore the Bondo plant
              </span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Meta strip pinned to hero bottom */}
        <motion.dl
          {...rise(0.3)}
          className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/15 pt-8 sm:grid-cols-4 sm:gap-x-10"
        >
          {[
            { k: 'Plant approval', v: 'NEMA/PR/SYA/002' },
            { k: 'Active sites', v: 'Bondo · Taita Taveta' },
            { k: 'Delivery model', v: 'Turnkey EPC · CIP/CIL' },
            { k: 'Regional reach', v: '5 East-African countries' },
          ].map((s) => (
            <div key={s.k}>
              <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/55">
                {s.k}
              </dt>
              <dd className="mt-1.5 font-display text-sm font-semibold tracking-tight text-white sm:text-[0.95rem]">
                {s.v}
              </dd>
            </div>
          ))}
        </motion.dl>

        <motion.div
          {...rise(0.4)}
          className="mt-8 flex items-center justify-center text-white/50"
        >
          <span className="inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.24em]">
            Scroll
            <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
          </span>
        </motion.div>
      </div>
    </section>
  );
}
