'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { galleryImages } from '@/config/gallery';

/**
 * Four large capability tiles laid out asymmetrically (bento) with cinematic
 * hover — image scales, gradient veil deepens, chip lifts, arrow slides in.
 */
export function CapabilityTiles() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-5">
      <Tile
        href="/services/gold-mining"
        eyebrow="01 · Extraction"
        title="Gold mining"
        image="/images/gallery/dji-0308.webp"
        className="md:col-span-4 md:row-span-2 md:aspect-[16/11]"
        featured
      />
      <Tile
        href="/gold-processing"
        eyebrow="02 · Processing"
        title="CIP · CIL plants"
        image="/images/gallery/ace4116.webp"
        className="md:col-span-2 md:aspect-[6/5]"
      />
      <Tile
        href="/equipment"
        eyebrow="03 · Machinery"
        title="Equipment install"
        image="/images/gallery/greenngoria-10.webp"
        className="md:col-span-2 md:aspect-[6/5]"
      />
      <Tile
        href="/technical-assessment"
        eyebrow="04 · Optimisation"
        title="Plant assessment"
        image="/images/gallery/ace4055.webp"
        className="md:col-span-3 md:aspect-[16/10]"
      />
      <Tile
        href="/projects"
        eyebrow="05 · Delivered"
        title="Completed projects"
        image="/images/gallery/dji-0338.webp"
        className="md:col-span-3 md:aspect-[16/10]"
      />
    </div>
  );
}

function Tile({
  href,
  eyebrow,
  title,
  image,
  className = '',
  featured = false,
}: {
  href: string;
  eyebrow: string;
  title: string;
  image: string;
  className?: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-2xl ring-1 ring-white/10 aspect-[4/3] ${className}`}
    >
      <Image
        src={image}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
      />
      {/* Base + hover veils */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
      <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/15" />
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white/70">
          {eyebrow}
        </span>
        <h3
          className={`mt-1 font-display font-bold tracking-tight text-white ${
            featured ? 'text-3xl sm:text-4xl md:text-5xl' : 'text-xl sm:text-2xl'
          }`}
        >
          {title}
        </h3>
        <span className="mt-3 inline-flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/85 opacity-0 -translate-y-1 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
          View
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

/**
 * Editorial masonry peek of the /gallery — 8 photos in Pinterest-style
 * columns, each with an elegant hover lift.
 */
export function GalleryPeek() {
  const picks = pickForShowcase(galleryImages, 8);
  return (
    <div className="[column-fill:_balance] gap-4 sm:columns-2 md:columns-3 md:gap-5">
      {picks.map((img) => (
        <Link
          key={img.src}
          href="/gallery"
          className="group mb-4 block overflow-hidden rounded-xl ring-1 ring-hairline transition-all duration-500 hover:-translate-y-1 hover:ring-brand-500/40 hover:shadow-xl md:mb-5"
        >
          <Image
            src={img.src}
            alt={img.alt}
            width={img.width}
            height={img.height}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-auto w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          />
        </Link>
      ))}
    </div>
  );
}

/**
 * Numbers strip — big display type with elegant underline hover.
 */
export function Metrics({
  items,
}: {
  items: { value: string; label: string; hint?: string }[];
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 sm:gap-x-10">
      {items.map((m) => (
        <div key={m.label} className="group">
          <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {m.label}
          </dt>
          <dd className="mt-2 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {m.value}
          </dd>
          {m.hint && (
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {m.hint}
            </p>
          )}
          <div className="mt-4 h-px w-8 bg-brand-500 transition-all duration-500 group-hover:w-full group-hover:bg-brand-500/70" />
        </div>
      ))}
    </dl>
  );
}

/**
 * Choose a small set that leans on distinct compositions — take every Nth
 * item so the peek doesn't cluster on visually similar photos.
 */
function pickForShowcase<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  const step = items.length / n;
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(items[Math.floor(i * step)]);
  return out;
}
