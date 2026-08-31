import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-11 w-full rounded-md border border-input bg-card px-3.5 py-2 text-sm ring-offset-background shadow-hairline',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-subtle',
            'hover:border-brand-500/40',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-60',
            'transition-[border-color,box-shadow] duration-micro ease-out-expo',
            error &&
              'border-destructive hover:border-destructive focus-visible:ring-destructive',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className,
          )}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
        {error && (
          <p
            className="mt-1.5 text-xs font-medium leading-5 text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };

// ─── Textarea ──────────────────────────────────────────────────────────────

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <div className="relative w-full">
      <textarea
        className={cn(
          'flex min-h-[120px] w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-sm leading-6 shadow-hairline',
          'placeholder:text-subtle',
          'hover:border-brand-500/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-60 resize-y',
          'transition-[border-color,box-shadow] duration-micro ease-out-expo',
          error &&
            'border-destructive hover:border-destructive focus-visible:ring-destructive',
          className,
        )}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {error && (
        <p
          className="mt-1.5 text-xs font-medium leading-5 text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  ),
);
Textarea.displayName = 'Textarea';

export { Textarea };

// ─── Label ─────────────────────────────────────────────────────────────────

import * as LabelPrimitive from '@radix-ui/react-label';
import { cva } from 'class-variance-authority';

const labelVariants = cva(
  'text-sm font-semibold leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
