'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-[background-color,border-color,color,box-shadow,transform] duration-micro ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-low hover:bg-primary/90 hover:shadow-mid active:translate-y-px active:shadow-low',
        destructive:
          'bg-destructive text-destructive-foreground shadow-low hover:bg-destructive/90 active:translate-y-px',
        outline:
          'border border-input bg-card text-foreground shadow-low hover:border-brand-500/50 hover:bg-accent hover:text-accent-foreground hover:shadow-mid active:translate-y-px',
        secondary:
          'bg-secondary text-secondary-foreground shadow-low hover:bg-secondary/70 active:translate-y-px',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary',
        brand:
          'bg-brand-500 text-white shadow-mid hover:bg-brand-600 hover:shadow-high active:translate-y-px active:bg-brand-700 active:shadow-low dark:bg-brand-400 dark:text-mineral-charcoal dark:hover:bg-brand-300',
        'brand-outline':
          'border border-brand-500 text-brand-600 bg-transparent hover:bg-brand-500 hover:text-white dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-400 dark:hover:text-mineral-charcoal',
        /** For use on the fixed dark industrial surfaces. */
        'on-ink':
          'border border-white/25 bg-white/[0.06] text-white backdrop-blur-sm hover:border-white/50 hover:bg-white/[0.12] active:translate-y-px focus-visible:ring-brand-400 focus-visible:ring-offset-[hsl(var(--ink))]',
        mineral:
          'bg-mineral-charcoal text-white shadow-mid hover:bg-mineral-graphite active:translate-y-px',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 rounded-md px-4 text-[0.8125rem]',
        lg: 'h-12 rounded-md px-7 text-[0.9375rem]',
        xl: 'h-14 rounded-md px-8 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-9 w-9',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref as any}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : leftIcon ? (
          <span className="shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}
        {children}
        {rightIcon && !loading && (
          <span className="shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
