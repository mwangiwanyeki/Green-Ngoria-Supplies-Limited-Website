'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * PlantStageCard / lifecycle track — an ordered progression where the sequence
 * itself is the information, so the stages are numbered. The rail draws itself
 * once on entry; reduced motion renders it already drawn.
 */
export function LifecycleTrack({
  stages,
  className,
}: {
  stages: string[];
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.ol
      className={cn(
        'relative grid gap-y-8 md:grid-cols-3 md:gap-x-8 lg:grid-cols-6 lg:gap-x-4',
        className,
      )}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '-15% 0px' }}
      variants={{
        hidden: {},
        shown: { transition: reduced ? {} : { staggerChildren: 0.07 } },
      }}
    >
      {/* Rail — drawn across the row on wide viewports */}
      <motion.span
        aria-hidden="true"
        className="absolute left-0 right-0 top-[0.4375rem] hidden h-px origin-left bg-gradient-to-r from-brand-500/60 via-border to-border lg:block"
        variants={
          reduced
            ? {}
            : {
                hidden: { scaleX: 0 },
                shown: {
                  scaleX: 1,
                  transition: { duration: 0.9, ease: EASE },
                },
              }
        }
      />

      {stages.map((stage, index) => (
        <motion.li
          key={stage}
          className="relative"
          variants={
            reduced
              ? {}
              : {
                  hidden: { opacity: 0, y: 16 },
                  shown: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.42, ease: EASE },
                  },
                }
          }
        >
          <span
            aria-hidden="true"
            className={cn(
              'relative z-10 block h-[0.875rem] w-[0.875rem] rounded-full border-2 bg-background',
              index === 0
                ? 'border-brand-500 dark:border-brand-400'
                : 'border-border',
            )}
          />
          <p className="mt-5 font-mono text-xs text-subtle">
            {String(index + 1).padStart(2, '0')}
          </p>
          <h3 className="mt-1.5 font-display text-[0.9375rem] font-semibold leading-snug tracking-tight">
            {stage}
          </h3>
        </motion.li>
      ))}
    </motion.ol>
  );
}
