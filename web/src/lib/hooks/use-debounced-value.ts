'use client';

import { useEffect, useState } from 'react';

/**
 * Returns a copy of `value` that lags behind by `delay` ms of quiet time —
 * every fast-changing update within the window collapses to one commit.
 * Used to feed keystroke-driven search boxes to TanStack Query without
 * firing a new request per keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
