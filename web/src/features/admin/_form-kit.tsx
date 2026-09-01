'use client';

/**
 * Shared building blocks for the admin "create / edit / delete" dialogs.
 *
 * The backend runs a global ValidationPipe with `whitelist` and
 * `forbidNonWhitelisted: true`, so payloads must contain *only* fields declared
 * on the matching DTO, and optional fields must be omitted entirely rather than
 * sent as empty strings. `buildPayload` below enforces that.
 */

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { ApiError } from '@/lib/api/api-error';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ─── Errors ────────────────────────────────────────────────────────────────

/**
 * Turn an unknown thrown value into the most specific message we can show.
 * Nest's ValidationPipe surfaces its messages as a string[] on `errors`.
 */
export function apiErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (err instanceof ApiError) {
    const messages = (err.errors ?? []).filter(
      (e): e is string => typeof e === 'string' && e.trim().length > 0,
    );
    if (messages.length > 0) return messages.join(' · ');
    return err.displayMessage;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

// ─── Payload building ──────────────────────────────────────────────────────

/**
 * Drop keys whose value is undefined, null or an empty/whitespace-only string
 * so optional DTO fields are omitted rather than sent as `""`.
 */
export function buildPayload<T extends Record<string, unknown>>(
  input: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (typeof value === 'number' && Number.isNaN(value)) continue;
    out[key] = typeof value === 'string' ? value.trim() : value;
  }
  return out;
}

/** Parse a numeric form field, returning undefined when blank/invalid. */
export function optionalNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Convert a `<input type="date">` value into an ISO string the DTO accepts. */
export function optionalDate(value: string): string | undefined {
  if (!value.trim()) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

// ─── Field primitives ──────────────────────────────────────────────────────

interface FieldShellProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  required,
  error,
  hint,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
  ...shell
}: Omit<FieldShellProps, 'children'> & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  disabled?: boolean;
}) {
  return (
    <Field {...shell}>
      <Input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={shell.label}
      />
    </Field>
  );
}

export function TextAreaField({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
  ...shell
}: Omit<FieldShellProps, 'children'> & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <Field {...shell}>
      <Textarea
        rows={rows}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={shell.label}
      />
    </Field>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * A plain <select>. The Radix Select in components/ui is great for filter bars
 * but cannot render inside a Dialog without extra portal wiring, so forms use
 * the native control.
 */
export function SelectField({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  ...shell
}: Omit<FieldShellProps, 'children'> & {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Field {...shell}>
      <select
        value={value}
        disabled={disabled}
        aria-label={shell.label}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-60',
          shell.error && 'border-destructive',
        )}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-input accent-current"
      />
      <span>{label}</span>
    </label>
  );
}

/** Build enum <option>s from a Prisma enum's string values. */
export function enumOptions(values: readonly string[]): SelectOption[] {
  return values.map((v) => ({
    value: v,
    label: v
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^./, (c) => c.toUpperCase()),
  }));
}

// ─── Form dialog shell ─────────────────────────────────────────────────────

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  onSubmit,
  pending,
  error,
  disabled,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel: string;
  onSubmit: () => void;
  pending?: boolean;
  error?: string | null;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Don't let a click-away discard an in-flight submit.
        if (pending && !next) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        className={cn('sm:max-w-lg', className)}
        onInteractOutside={(e) => {
          if (pending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && <DialogDescription>{description}</DialogDescription>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="grid max-h-[60vh] gap-4 overflow-y-auto p-6">
            {children}
            {error && (
              <p
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              disabled={pending || disabled}
              leftIcon={
                pending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined
              }
            >
              {pending ? 'Saving…' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Confirmation ──────────────────────────────────────────────────────────

/**
 * There is no AlertDialog primitive in components/ui yet, so destructive and
 * status-transition actions confirm through the native dialog.
 */
export function confirmAction(message: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.confirm(message);
}

// ─── Row action menu ───────────────────────────────────────────────────────

export const rowMenuContentClass =
  'z-50 min-w-[190px] rounded-xl border border-border bg-card p-1 shadow-xl';
export const rowMenuItemClass =
  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:bg-muted disabled:pointer-events-none disabled:opacity-50';
export const rowMenuDestructiveItemClass =
  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive outline-none cursor-pointer hover:bg-destructive/10';
