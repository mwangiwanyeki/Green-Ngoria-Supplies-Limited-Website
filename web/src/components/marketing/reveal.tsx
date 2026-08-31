'use client';

import * as React from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

type RevealKind = 'rise' | 'unblur' | 'wipe' | 'draw';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /**
   * The authored moment for this section. One per section — not the same
   * fade repeated everywhere.
   *  - `rise`   subtle lift, for text blocks
   *  - `unblur` focus-pull, for a hero or a single feature panel
   *  - `wipe`   clip-path reveal, for a diagram or a rule
   *  - `draw`   staggered children, for a list, ledger or timeline
   */
  kind?: RevealKind;
  /** Seconds. */
  delay?: number;
  /** `draw` only: seconds between children. */
  stagger?: number;
  as?: 'div' | 'section' | 'ul' | 'ol' | 'dl';
}

function variantsFor(kind: RevealKind, reduced: boolean): Variants {
  if (reduced) {
    return { hidden: { opacity: 1 }, shown: { opacity: 1 } };
  }
  switch (kind) {
    case 'unblur':
      return {
        hidden: { opacity: 0, filter: 'blur(10px)', y: 14 },
        shown: {
          opacity: 1,
          filter: 'blur(0px)',
          y: 0,
          transition: { duration: 0.62, ease: EASE_OUT_EXPO },
        },
      };
    case 'wipe':
      return {
        hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
        shown: {
          opacity: 1,
          clipPath: 'inset(0 0% 0 0)',
          transition: { duration: 0.72, ease: EASE_OUT_EXPO },
        },
      };
    case 'draw':
    case 'rise':
    default:
      return {
        hidden: { opacity: 0, y: 18 },
        shown: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.42, ease: EASE_OUT_EXPO },
        },
      };
  }
}

/** Scroll-triggered reveal. Renders inert markup when motion is reduced. */
export function Reveal({
  children,
  className,
  kind = 'rise',
  delay = 0,
  stagger = 0.06,
  as = 'div',
}: RevealProps) {
  const reduced = useReducedMotion() ?? false;
  const Comp = motion[as];
  const variants = variantsFor(kind, reduced);

  return (
    <Comp
      className={cn(className)}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '-12% 0px -8% 0px' }}
      variants={
        kind === 'draw'
          ? {
              hidden: {},
              shown: {
                transition: reduced
                  ? {}
                  : { staggerChildren: stagger, delayChildren: delay },
              },
            }
          : variants
      }
      transition={kind === 'draw' ? undefined : { delay }}
    >
      {children}
    </Comp>
  );
}

/** A child of `<Reveal kind="draw">`. */
export function RevealItem({
  children,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'tr';
}) {
  const reduced = useReducedMotion() ?? false;
  const Comp = motion[as];
  return (
    <Comp
      className={cn(className)}
      variants={
        reduced
          ? { hidden: { opacity: 1 }, shown: { opacity: 1 } }
          : {
              hidden: { opacity: 0, y: 14 },
              shown: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, ease: EASE_OUT_EXPO },
              },
            }
      }
    >
      {children}
    </Comp>
  );
}
