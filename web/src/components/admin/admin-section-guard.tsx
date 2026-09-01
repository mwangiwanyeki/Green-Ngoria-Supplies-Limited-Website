'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock } from 'lucide-react';
import { useMe } from '@/lib/api/hooks/use-auth';
import {
  getAllowedRolesForPath,
  hasRoleAccess,
  EXECUTIVE_ROLES,
} from '@/config/navigation';
import { Button } from '@/components/ui/button';

interface AdminSectionGuardProps {
  children: React.ReactNode;
  allowedRoles?: readonly string[];
}

export function AdminSectionGuard({
  children,
  allowedRoles: explicitAllowedRoles,
}: AdminSectionGuardProps) {
  const pathname = usePathname();
  const { data: user } = useMe();
  const userRoles = user?.roles ?? [];

  // Determine allowed roles either from explicit prop or by matching navigation config
  const allowedRoles =
    explicitAllowedRoles ?? getAllowedRolesForPath(pathname);

  // Executive roles always bypass restriction
  const isAllowed = hasRoleAccess(allowedRoles ?? undefined, userRoles);

  if (!isAllowed) {
    const formattedRoles = (allowedRoles ?? [])
      .filter((r) => !EXECUTIVE_ROLES.includes(r as any))
      .map((r) => r.replace(/_/g, ' '))
      .join(', ');

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mb-5">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1 text-xs font-semibold text-muted-foreground border border-hairline mb-3">
          <Lock className="h-3 w-3" />
          Departmental Boundary
        </span>

        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Access Restricted to Authorized Roles
        </h2>

        <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
          Your current profile does not have permission to view or manage this
          module. This area is reserved for{' '}
          <span className="font-semibold text-foreground">
            {formattedRoles || 'designated personnel'}
          </span>
          .
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin">
              <LayoutDashboard className="h-4 w-4 mr-2 text-brand-600 dark:text-brand-400" />
              Return to My Dashboard
            </Link>
          </Button>
          <Button variant="secondary" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
