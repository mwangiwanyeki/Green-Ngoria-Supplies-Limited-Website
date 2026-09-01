import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Green Ngoria Supplies Ltd brand logo.
 *
 * Fully transparent artwork engineered for seamless integration:
 * - On light surfaces: crisp emerald green mark & wordmark with charcoal tagline.
 * - On dark surfaces (`onDark`): 100% transparent background with brilliant white text/ring
 *   and vivid emerald green mark/wordmark that harmonizes directly into the section.
 * - In adaptive mode (default): automatically switches between light/dark variants based on theme.
 */

const LOGO_LIGHT_SRC = '/brand/green-ngoria-logo.png';
const LOGO_DARK_SRC = '/brand/green-ngoria-logo-white.png';
const LOGO_MARK_LIGHT_SRC = '/brand/green-ngoria-mark.png';
const LOGO_MARK_DARK_SRC = '/brand/green-ngoria-mark-white.png';

// Intrinsic aspect ratio of the supplied artwork (1001 x 356 ≈ 2.81 : 1).
const INTRINSIC_WIDTH = 1001;
const INTRINSIC_HEIGHT = 356;

interface LogoProps {
  /** Rendered height of the logo image in pixels. Width scales to ratio. */
  height?: number;
  /** Force the dark-surface transparent logo variant (for dark sections like footer, hero, auth sidebar). */
  onDark?: boolean;
  /** Render only the square brand mark (circular emblem) without wordmark text. */
  markOnly?: boolean;
  /** Prioritise loading (use for the above-the-fold header logo). */
  priority?: boolean;
  className?: string;
}

export function Logo({
  height = 48,
  onDark,
  markOnly = false,
  priority = false,
  className,
}: LogoProps) {
  if (markOnly) {
    if (onDark === true) {
      return (
        <span
          className={cn(
            'inline-flex shrink-0 items-center bg-transparent',
            className,
          )}
        >
          <Image
            src={LOGO_MARK_DARK_SRC}
            alt="Green Ngoria Supplies Ltd"
            width={height}
            height={height}
            priority={priority}
            style={{ height, width: height }}
            className="object-contain"
          />
        </span>
      );
    }

    if (onDark === false) {
      return (
        <span
          className={cn(
            'inline-flex shrink-0 items-center bg-transparent',
            className,
          )}
        >
          <Image
            src={LOGO_MARK_LIGHT_SRC}
            alt="Green Ngoria Supplies Ltd"
            width={height}
            height={height}
            priority={priority}
            style={{ height, width: height }}
            className="object-contain"
          />
        </span>
      );
    }

    // Adaptive (respects dark theme mode)
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center bg-transparent',
          className,
        )}
      >
        <Image
          src={LOGO_MARK_LIGHT_SRC}
          alt="Green Ngoria Supplies Ltd"
          width={height}
          height={height}
          priority={priority}
          style={{ height, width: height }}
          className="object-contain dark:hidden"
        />
        <Image
          src={LOGO_MARK_DARK_SRC}
          alt="Green Ngoria Supplies Ltd"
          width={height}
          height={height}
          priority={priority}
          style={{ height, width: height }}
          className="hidden object-contain dark:inline-block"
        />
      </span>
    );
  }

  const width = Math.round((height * INTRINSIC_WIDTH) / INTRINSIC_HEIGHT);

  if (onDark === true) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center bg-transparent',
          className,
        )}
      >
        <Image
          src={LOGO_DARK_SRC}
          alt="Green Ngoria Supplies Ltd"
          width={width}
          height={INTRINSIC_HEIGHT}
          priority={priority}
          style={{ height, width: 'auto' }}
          className="object-contain"
        />
      </span>
    );
  }

  if (onDark === false) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center bg-transparent',
          className,
        )}
      >
        <Image
          src={LOGO_LIGHT_SRC}
          alt="Green Ngoria Supplies Ltd"
          width={width}
          height={INTRINSIC_HEIGHT}
          priority={priority}
          style={{ height, width: 'auto' }}
          className="object-contain"
        />
      </span>
    );
  }

  // Adaptive (respects dark theme mode)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center bg-transparent',
        className,
      )}
    >
      <Image
        src={LOGO_LIGHT_SRC}
        alt="Green Ngoria Supplies Ltd"
        width={width}
        height={INTRINSIC_HEIGHT}
        priority={priority}
        style={{ height, width: 'auto' }}
        className="object-contain dark:hidden"
      />
      <Image
        src={LOGO_DARK_SRC}
        alt="Green Ngoria Supplies Ltd"
        width={width}
        height={INTRINSIC_HEIGHT}
        priority={priority}
        style={{ height, width: 'auto' }}
        className="hidden object-contain dark:inline-block"
      />
    </span>
  );
}
