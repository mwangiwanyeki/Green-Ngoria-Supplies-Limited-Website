/**
 * Helpers for turning react-hook-form values into request bodies the NestJS
 * DTOs accept.
 *
 * The backend validates with class-validator, where an optional field is
 * `@IsOptional()` — meaning it must be *absent*, not an empty string. An empty
 * `<input>` yields `''`, which fails `@IsUUID()`, `@IsEmail()`, `@IsUrl()` and
 * friends, so strip those before sending.
 */

/** Removes `''`, `null`, `undefined` and empty arrays from a request body. */
export function compact<T extends Record<string, unknown>>(
  input: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'number' && Number.isNaN(value)) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Converts a `<input type="date">` / `type="datetime-local"` value into the ISO
 * string `@Type(() => Date) @IsDate()` expects. Returns undefined when blank or
 * unparseable so the field is omitted entirely.
 */
export function toIsoDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Formats an ISO timestamp back into a `<input type="date">` value. */
export function toDateInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

/** Formats an ISO timestamp back into a `<input type="datetime-local">` value. */
export function toDateTimeInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** Splits a comma-separated input into a trimmed string array (or undefined). */
export function toStringArray(value?: string | null): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}
