'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

/**
 * Cross-fading photographic backdrop for the home hero. Sits as the backmost
 * layer of the (dark) hero section; a strong ink gradient + tint is laid over
 * it so the white headline, body copy, and schematic stay legible. Reduced
 * motion (or a single image) renders one static frame with no rotation.
 *
 * Photos live in /public/images/mining/hero/ — real Green Ngoria site imagery
 * (aerial CIP/CIL plant, tailings pond, earthworks, ore haulage).
 */
const SLIDES = [
  {
    src: '/images/mining/hero/aerial-processing-plant-bondo.jpg',
    alt: 'Aerial view of the Green Ngoria CIP/CIL gold processing plant at Bondo',
  },
  {
    src: '/images/mining/hero/tailings-pond-aerial.jpg',
    alt: 'Aerial view of a lined tailings and settling pond at a Green Ngoria mining site',
  },
  {
    src: '/images/mining/hero/shantui-excavator-earthworks.jpg',
    alt: 'Green Ngoria Shantui excavator carrying out earthworks on site',
  },
  {
    src: '/images/mining/hero/green-ngoria-tipper-offloading.jpg',
    alt: 'Green Ngoria tipper truck offloading crushed ore on site',
  },
] as const;

const INTERVAL_MS = 6000;

export function HeroBackdrop() {
  const reduced = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced || SLIDES.length < 2) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % SLIDES.length),
      INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, [reduced]);

  const active = SLIDES[index];

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {reduced ? (
        <Image
          src={SLIDES[0].src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <AnimatePresence initial={false}>
          <motion.div
            key={active.src}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.4, ease: 'easeInOut' },
              scale: { duration: INTERVAL_MS / 1000 + 1.4, ease: 'linear' },
            }}
            className="absolute inset-0"
          >
            <Image
              src={active.src}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Legibility scrim: keep the dark hero mood, darken toward the text side. */}
      <div className="absolute inset-0 bg-[hsl(var(--ink))]/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--ink))]/90 via-[hsl(var(--ink))]/60 to-[hsl(var(--ink))]/25" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[hsl(var(--ink))]" />
    </div>
  );
}
