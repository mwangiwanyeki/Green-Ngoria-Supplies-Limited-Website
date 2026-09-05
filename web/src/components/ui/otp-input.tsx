'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  /** Number of digit boxes. Default 6. */
  length?: number;
  value: string;
  onChange: (value: string) => void;
  /** Fired once when the last digit fills, with the complete code. */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Visually mark the inputs as errored (e.g. after a rejected code). */
  error?: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * Segmented one-time-code input: N single-digit boxes with auto-advance,
 * backspace-to-previous, arrow-key navigation, full paste support, and an
 * onComplete callback that fires exactly once when every box is filled (so
 * callers can auto-submit). Digits only.
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
  error = false,
  className,
  'aria-label': ariaLabel = 'One-time code',
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [firedFor, setFiredFor] = useState<string | null>(null);

  const digits = value.split('').slice(0, length);
  while (digits.length < length) digits.push('');

  // Fire onComplete once per distinct complete value.
  useEffect(() => {
    if (value.length === length && /^\d+$/.test(value)) {
      if (firedFor !== value) {
        setFiredFor(value);
        onComplete?.(value);
      }
    } else if (firedFor !== null) {
      setFiredFor(null);
    }
  }, [value, length, onComplete, firedFor]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setDigit = useCallback(
    (index: number, digit: string) => {
      const next = digits.slice();
      next[index] = digit;
      onChange(next.join('').slice(0, length));
    },
    [digits, length, onChange],
  );

  const handleChange = (index: number, raw: string) => {
    const only = raw.replace(/\D/g, '');
    if (!only) {
      setDigit(index, '');
      return;
    }
    // If multiple chars arrived (fast typing / mobile), distribute forward.
    if (only.length > 1) {
      const chars = only.split('');
      const next = digits.slice();
      let cursor = index;
      for (const c of chars) {
        if (cursor >= length) break;
        next[cursor] = c;
        cursor++;
      }
      onChange(next.join('').slice(0, length));
      refs.current[Math.min(cursor, length - 1)]?.focus();
      return;
    }
    setDigit(index, only);
    if (index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        setDigit(index, '');
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        setDigit(index - 1, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`${ariaLabel} digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-12 w-11 rounded-lg border text-center text-lg font-semibold tabular-nums shadow-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-destructive bg-destructive/5 text-destructive'
              : 'border-border bg-background text-foreground',
          )}
        />
      ))}
    </div>
  );
}
