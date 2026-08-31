import * as React from 'react';

/**
 * Unit-operation glyphs for the CIP/CIL process train.
 *
 * Authored linework — one family, one stroke weight, one 24×24 grid — so the
 * diagram reads as engineering schematic rather than decoration. These are
 * indicative unit symbols, not a process design.
 */

type GlyphProps = React.SVGProps<SVGSVGElement>;

function Glyph({ children, ...props }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Feed hopper with apron discharge. */
export function GlyphFeed(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M3 4h18l-5.5 9h-7L3 4Z" />
      <path d="M10.5 13v3.5h3V13" />
      <path d="M4 20h16" />
      <path d="M7.5 17.5 6 20M16.5 17.5 18 20" />
    </Glyph>
  );
}

/** Jaw crusher — converging plates reducing feed. */
export function GlyphCrush(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 3v10.5L10 19M20 3v10.5L14 19" />
      <path d="M9.5 21h5" />
      <path d="M12 4.5v3M9 6.5l1.5 2M15 6.5l-1.5 2" />
    </Glyph>
  );
}

/** Mill drum with charge arc and drive. */
export function GlyphMill(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M5.4 16.2a8 8 0 0 0 13.2 0" />
      <path d="M12 4v2.5M20 12h-2.5" />
      <circle cx="12" cy="12" r="1" />
    </Glyph>
  );
}

/** Hydrocyclone — tangential feed, overflow up, underflow down. */
export function GlyphCyclone(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M5 4h14l-5.5 11h-3L5 4Z" />
      <path d="M11.5 15v3.5M12.5 15v3.5" />
      <path d="M12 18.5 10 21M12 18.5 14 21" />
      <path d="M12 4V1.5M19 4l2.5-2" />
    </Glyph>
  );
}

/** Agitated leach tank — shaft and impeller. */
export function GlyphLeach(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 6h16v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6Z" />
      <path d="M12 3v11" />
      <path d="M8.5 14h7" />
      <path d="M6.5 9.5h11" />
      <path d="M9 3h6" />
    </Glyph>
  );
}

/** Adsorption tank with activated-carbon charge. */
export function GlyphAdsorb(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 6h16v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6Z" />
      <path d="M12 3v6" />
      <path d="M9 3h6" />
      <circle cx="8.5" cy="14" r="1.1" />
      <circle cx="12" cy="16.5" r="1.1" />
      <circle cx="15.5" cy="13.5" r="1.1" />
      <circle cx="12" cy="12" r="1.1" />
    </Glyph>
  );
}

/** Elution column feeding electrowinning / doré. */
export function GlyphElution(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="4" y="3" width="6" height="14" rx="1.5" />
      <path d="M7 3V1.5M7 17v3.5" />
      <path d="M7 6.5h.01M7 10h.01M7 13.5h.01" />
      <path d="M14 20h7l-1.4-4h-4.2L14 20Z" />
      <path d="M17.5 16v-3.5M14.5 12.5h6" />
    </Glyph>
  );
}

/** Lined tailings storage facility with return water. */
export function GlyphTailings(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M2 19h20" />
      <path d="M4 19 8 8h8l4 11" />
      <path d="M7.2 13h9.6" />
      <path d="M9.5 16h5" />
      <path d="M12 5.5V2.5M12 2.5 10 4.5M12 2.5l2 2" />
    </Glyph>
  );
}

export const PROCESS_GLYPHS = {
  feed: GlyphFeed,
  crush: GlyphCrush,
  mill: GlyphMill,
  cyclone: GlyphCyclone,
  leach: GlyphLeach,
  adsorb: GlyphAdsorb,
  elution: GlyphElution,
  tailings: GlyphTailings,
} as const;

export type ProcessGlyphName = keyof typeof PROCESS_GLYPHS;
