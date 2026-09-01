'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

interface AuthBoundaryProps {
  children: React.ReactNode;
  allowedRoles: readonly string[];
  /** Sign-in page to send unauthenticated visitors to. Admin and portal
   *  areas each have their own, so this defaults to the portal login. */
  loginPath?: string;
}

export function AuthBoundary({
  children,
  allowedRoles,
  loginPath = '/auth/login',
}: AuthBoundaryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const authReady = useAuthStore((state) => state.authReady);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const hasAllowedRole =
    !!user && user.roles.some((role) => allowedRoles.includes(role));

  useEffect(() => {
    if (!authReady) return;

    if (!accessToken || !user) {
      router.replace(`${loginPath}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!hasAllowedRole) {
      router.replace('/forbidden');
    }
  }, [
    accessToken,
    authReady,
    hasAllowedRole,
    loginPath,
    pathname,
    router,
    user,
  ]);

  if (!authReady || !accessToken || !user || !hasAllowedRole) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">
            Verifying secure access…
          </p>
        </div>
      </div>
    );
  }

  return children;
}
