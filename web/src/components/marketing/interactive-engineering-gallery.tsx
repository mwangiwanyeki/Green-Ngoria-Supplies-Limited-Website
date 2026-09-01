'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface GalleryItem {
  src: string;
  alt: string;
  title: string;
  description: string;
  tag: string;
}

export function InteractiveEngineeringGallery({
  items,
  headline = 'High-Resolution Engineering & Field Gallery',
  subhead = 'Click on any image to inspect high-resolution mechanical details, structural assemblies, and process schematics.',
}: {
  items: GalleryItem[];
  headline?: string;
  subhead?: string;
}) {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = React.useState<number>(1);

  const activeItem = selectedIndex !== null ? items[selectedIndex] : null;

  const handleOpen = (index: number) => {
    setSelectedIndex(index);
    setZoomLevel(1);
  };

  const handleClose = () => {
    setSelectedIndex(null);
    setZoomLevel(1);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + items.length) % items.length);
    setZoomLevel(1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % items.length);
    setZoomLevel(1);
  };

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => (prev === 1 ? 1.75 : prev === 1.75 ? 2.5 : 1));
  };

  // Keyboard navigation
  React.useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft')
        setSelectedIndex((prev) =>
          prev !== null ? (prev - 1 + items.length) % items.length : null,
        );
      if (e.key === 'ArrowRight')
        setSelectedIndex((prev) =>
          prev !== null ? (prev + 1) % items.length : null,
        );
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, items.length]);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-400">
          <Layers className="h-4 w-4" />
          Technical Imagery &amp; Field Records
        </div>
        <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
          {headline}
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {subhead}
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => (
          <div
            key={item.src + idx}
            onClick={() => handleOpen(idx)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-hairline bg-card shadow-card transition-all duration-ui hover:border-brand-500/50 hover:shadow-panel"
          >
            {/* Top Accent Line */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-brand-500 via-amber-400 to-brand-600 opacity-0 transition-opacity group-hover:opacity-100"
            />

            {/* Media wrapper */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                priority={idx < 2}
                className="object-cover transition-transform duration-emphasis ease-out-expo group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:opacity-90" />

              {/* Tag pill */}
              <div className="absolute left-3.5 top-3.5 z-10">
                <span className="rounded-md bg-black/75 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  {item.tag}
                </span>
              </div>

              {/* Hover Zoom Icon */}
              <div className="absolute right-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-md transition-all duration-ui group-hover:opacity-100 group-hover:scale-110">
                <Maximize2 className="h-4 w-4" />
              </div>

              {/* Text overlay */}
              <div className="absolute bottom-3.5 left-3.5 right-3.5 z-10">
                <h4 className="font-display text-base font-bold text-white transition-colors group-hover:text-brand-300">
                  {item.title}
                </h4>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/80">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Bottom metadata footer */}
            <div className="flex items-center justify-between border-t border-hairline px-4 py-2.5 text-[0.6875rem] text-muted-foreground">
              <span className="font-mono">Record #{String(idx + 1).padStart(2, '0')}</span>
              <span className="flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400">
                <ZoomIn className="h-3 w-3" /> Click to zoom &amp; inspect
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={handleClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl animate-fade-in"
        >
          {/* Lightbox Controls Top Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/60 px-6 py-4 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <span className="rounded bg-brand-500/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand-300">
                {activeItem.tag}
              </span>
              <span className="text-sm font-semibold text-white">
                {activeItem.title}
              </span>
              <span className="font-mono text-xs text-white/50">
                ({selectedIndex + 1} of {items.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleZoom}
                className="text-white hover:bg-white/10"
                title="Toggle Zoom"
              >
                {zoomLevel > 1 ? (
                  <>
                    <ZoomOut className="mr-1.5 h-4 w-4" /> Reset ({zoomLevel}x)
                  </>
                ) : (
                  <>
                    <ZoomIn className="mr-1.5 h-4 w-4" /> Zoom 2.5x
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close image preview"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous image"
            className="absolute left-4 z-20 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/25 hover:scale-110 sm:flex"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next image"
            className="absolute right-4 z-20 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/25 hover:scale-110 sm:flex"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Main Zoomable Image Canvas */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[80vh] max-w-6xl items-center justify-center overflow-auto rounded-xl p-2"
          >
            <div
              className={cn(
                'relative aspect-[16/9] w-[85vw] max-w-5xl transition-transform duration-ui ease-out-expo cursor-zoom-in',
                zoomLevel > 1 && 'cursor-grab active:cursor-grabbing',
              )}
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
              }}
              onClick={toggleZoom}
            >
              <Image
                src={activeItem.src}
                alt={activeItem.alt}
                fill
                quality={95}
                priority
                className="rounded-lg object-contain shadow-2xl"
                sizes="(max-width: 1400px) 100vw, 1400px"
              />
            </div>
          </div>

          {/* Bottom Caption Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/75 px-6 py-4 backdrop-blur-md"
          >
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-medium text-white/90">
                {activeItem.description}
              </p>
              <p className="mt-1 font-mono text-[0.6875rem] text-white/50">
                Green Ngoria Supplies Limited · Engineering Document &amp; Asset Archive
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
