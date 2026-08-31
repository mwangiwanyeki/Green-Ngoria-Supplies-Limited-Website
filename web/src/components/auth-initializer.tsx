'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { refreshAccessToken } from '@/lib/api/api-client';

/**
 * AuthInitializer — runs once on app mount.
 * Uses the signed HttpOnly refresh cookie to restore the in-memory access token
 * requiring a re-login.
 *
 * Mount this inside the root layout, inside QueryProvider.
 */
export function AuthInitializer() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const clearTokens = useAuthStore((s) => s.clearTokens);
  const setAuthReady = useAuthStore((s) => s.setAuthReady);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // If we already have an in-memory token, restore it to window global
    if (accessToken && typeof window !== 'undefined') {
      window.__GNG_ACCESS_TOKEN = accessToken;
      setAuthReady(true);
      return;
    }

    // A browser cannot inspect HttpOnly cookies, so attempt one silent refresh.
    if (!accessToken) {
      refreshAccessToken()
        .then((newAccess) => {
          setAccessToken(newAccess);
        })
        .catch(() => {
          // Refresh token expired or invalid — clear state silently
          // User will be redirected when they try to access a protected page
          clearTokens();
        })
        .finally(() => setAuthReady(true));
    }
  }, []); // intentionally empty deps — run once on mount only

  return null;
}
