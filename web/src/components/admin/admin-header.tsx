'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Search,
  UserRound,
  Settings,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMe, useLogout } from '@/lib/api/hooks/use-auth';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

/* ── Breadcrumb builder ─────────────────────────────────────────────────── */

function buildBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  let path = '';
  for (const part of parts) {
    path += `/${part}`;
    const label = part
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, href: path });
  }

  return crumbs;
}

/* ════════════════════════════════════════════════════════════════════════ */

export function AdminHeader() {
  const { data: user } = useMe();
  const logout = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const breadcrumbs = buildBreadcrumbs(pathname);

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';

  const onSignOut = () => {
    logout.mutate(undefined, {
      onSettled: () => router.push('/auth/admin'),
    });
  };

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-white/[0.06] bg-card/60 backdrop-blur-xl px-6 shrink-0">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <Link
          href="/admin"
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <Home className="h-4 w-4" />
        </Link>
        {breadcrumbs.slice(1).map((crumb, i) => (
          <div key={crumb.href} className="flex items-center gap-1.5 min-w-0">
            <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            {i === breadcrumbs.length - 2 ? (
              <span className="text-sm font-medium truncate">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Center: Search */}
      <div className="hidden sm:block flex-1 max-w-sm">
        <Input
          placeholder="Search anything… (⌘K)"
          leftIcon={<Search className="h-4 w-4" />}
          className="h-8 text-sm bg-white/[0.04] border-white/[0.08] focus:border-teal-500/40"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[9px] font-bold text-white">
            3
          </span>
        </Button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className={cn(
                'flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors',
                'hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card',
              )}
              aria-label="Open account menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white text-xs font-semibold select-none shadow-sm">
                {user ? getInitials(fullName || user.email) : '?'}
              </div>
              <div className="hidden sm:block text-left text-sm">
                <p className="font-medium leading-tight">{fullName || '—'}</p>
                <p className="text-xs text-muted-foreground leading-tight">
                  {user?.roles?.[0]?.replace(/_/g, ' ') ?? ''}
                </p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className={cn(
                'z-50 min-w-[15rem] overflow-hidden rounded-xl border border-white/[0.08] bg-card/95 backdrop-blur-2xl p-1 text-card-foreground shadow-2xl',
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
              )}
            >
              <div className="px-3 py-2.5">
                <p className="truncate text-sm font-semibold">
                  {fullName || 'Signed in'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email ?? ''}
                </p>
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-white/[0.06]" />
              <DropdownMenu.Item asChild>
                <Link
                  href="/admin/profile"
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none',
                    'focus:bg-white/[0.06] data-[highlighted]:bg-white/[0.06]',
                  )}
                >
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  Your profile
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  href="/admin/settings"
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none',
                    'focus:bg-white/[0.06] data-[highlighted]:bg-white/[0.06]',
                  )}
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Settings
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-white/[0.06]" />
              <DropdownMenu.Item
                onSelect={(e) => {
                  e.preventDefault();
                  onSignOut();
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive outline-none',
                  'focus:bg-destructive/10 data-[highlighted]:bg-destructive/10',
                )}
              >
                <LogOut className="h-4 w-4" />
                {logout.isPending ? 'Signing out…' : 'Sign out'}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
