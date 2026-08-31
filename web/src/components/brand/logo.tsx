import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Green Ngoria Supplies Ltd brand logo.
 *
 * Renders the official horizontal lockup (mark + wordmark) from
 * `public/brand/green-ngoria-logo.png`. The artwork is drawn for light
 * backgrounds (grey ring, black "seasons create ideas" text), so on dark
 * surfaces pass `onDark` to seat it on a white chip that keeps it legible.
 */

const LOGO_SRC = '/brand/green-ngoria-logo.png';
// Intrinsic aspect ratio of the supplied artwork (width : height ≈ 2.87 : 1).
const INTRINSIC_WIDTH = 1490;
const INTRINSIC_HEIGHT = 520;

interface LogoProps {
  /** Rendered height of the logo image in pixels. Width scales to ratio. */
  height?: number;
  /** Seat the logo on a white chip so it reads on dark surfaces. */
  onDark?: boolean;
  /** Prioritise loading (use for the above-the-fold header logo). */
  priority?: boolean;
  className?: string;
}

export function Logo({
  height = 40,
  onDark = false,
  priority = false,
  className,
}: LogoProps) {
  const width = Math.round((height * INTRINSIC_WIDTH) / INTRINSIC_HEIGHT);

  return (
    <span
      className={cn(
        'inline-flex items-center',
        onDark && 'rounded-md bg-white px-2.5 py-1.5 shadow-sm',
        className,
      )}
    >
      <Image
        src={LOGO_SRC}
        alt="Green Ngoria Supplies Ltd"
        width={width}
        height={height}
        priority={priority}
        style={{ height, width: 'auto' }}
      />
    </span>
  );
}
