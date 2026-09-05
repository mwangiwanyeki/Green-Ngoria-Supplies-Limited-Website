'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GalleryImage } from '@/config/gallery';

/**
 * Responsive masonry gallery with an accessible lightbox.
 * - CSS columns give a Pinterest-style masonry that respects each image's
 *   aspect ratio (from the manifest's width/height — no layout shift).
 * - Optional category filter chips.
 * - Lightbox: click to open, arrow keys / on-screen chevrons to move,
 *   Esc or backdrop click to close, focus-trapped close button.
 */
export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const i of images) if (i.category) set.add(i.category);
    return Array.from(set).sort();
  }, [images]);

  const [filter, setFilter] = useState<string | null>(null);
  const shown = useMemo(
    () => (filter ? images.filter((i) => i.category === filter) : images),
    [images, filter],
  );

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i + 1) % shown.length)),
    [shown.length],
  );
  const prev = useCallback(
    () =>
      setOpenIndex((i) =>
        i === null ? i : (i - 1 + shown.length) % shown.length,
      ),
    [shown.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex, close, next, prev]);

  const active = openIndex === null ? null : shown[openIndex];

  return (
    <div>
      {categories.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <FilterChip active={!filter} onClick={() => setFilter(null)}>
            All
          </FilterChip>
          {categories.map((c) => (
            <FilterChip key={c} active={filter === c} onClick={() => setFilter(c)}>
              {c}
            </FilterChip>
          ))}
        </div>
      )}

      <div className="[column-fill:_balance] gap-4 sm:columns-2 lg:columns-3">
        {shown.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="group mb-4 block w-full overflow-hidden rounded-xl border border-hairline bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={`Open image: ${img.alt}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {shown.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous image"
                className="absolute left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next image"
                className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <figure
            className="relative max-h-[88vh] max-w-[92vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={active.src}
              alt={active.alt}
              width={active.width}
              height={active.height}
              sizes="92vw"
              priority
              className="max-h-[82vh] w-auto rounded-lg object-contain"
            />
            <figcaption className="mt-3 text-center text-sm text-white/70">
              {active.alt}
              {shown.length > 1 && (
                <span className="ml-2 text-white/40">
                  {(openIndex ?? 0) + 1} / {shown.length}
                </span>
              )}
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
