'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Bell, ChevronDown, LogOut, Search, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMe, useLogout } from '@/lib/api/hooks/use-auth';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function AdminHeader() {
  const { data: user } = useMe();
  const logout = useLogout();
  const router = useRouter();

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';

  const onSignOut = () => {
    logout.mutate(undefined, {
      onSettled: () => router.push('/auth/admin'),
    });
  };

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-card px-6 shrink-0">
      <div className="flex-1 max-w-sm">
        <Input
          placeholder="Search anything… (⌘K)"
          leftIcon={<Search className="h-4 w-4" />}
          className="h-8 text-sm bg-muted/30"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className={cn(
                'flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors',
                'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
              )}
              aria-label="Open account menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-semibold select-none">
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
                'z-50 min-w-[15rem] overflow-hidden rounded-lg border border-border bg-card p-1 text-card-foreground shadow-high',
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
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item asChild>
                <Link
                  href="/admin/profile"
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none',
                    'focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent',
                  )}
                >
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  Your profile
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                onSelect={(e) => {
                  e.preventDefault();
                  onSignOut();
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive outline-none',
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
