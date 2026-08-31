'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Light/dark switch. Renders a stable placeholder until mounted. */
export function ThemeToggle({
  onInk = false,
  className,
}: {
  onInk?: boolean;
  className?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={
        mounted
          ? `Switch to ${isDark ? 'light' : 'dark'} theme`
          : 'Switch colour theme'
      }
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors duration-micro ease-out-expo',
        onInk
          ? 'border-white/20 text-white/75 hover:border-white/40 hover:bg-white/10 hover:text-white focus-visible:ring-brand-400 focus-visible:ring-offset-[hsl(var(--ink))]'
          : 'border-border text-muted-foreground hover:border-brand-500/40 hover:bg-accent hover:text-foreground',
        className,
      )}
    >
      <Sun
        className={cn(
          'h-[1.05rem] w-[1.05rem] transition-[opacity,transform] duration-ui ease-out-expo',
          isDark
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0',
        )}
        aria-hidden="true"
      />
      <Moon
        className={cn(
          'absolute h-[1.05rem] w-[1.05rem] transition-[opacity,transform] duration-ui ease-out-expo',
          isDark
            ? '-rotate-90 scale-0 opacity-0'
            : 'rotate-0 scale-100 opacity-100',
        )}
        aria-hidden="true"
      />
    </button>
  );
}
