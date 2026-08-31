'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/api/hooks/use-auth';
import { getInitials } from '@/lib/utils';

export function PortalHeader() {
  const { data: user } = useMe();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6 shrink-0">
      <div className="text-sm text-muted-foreground">
        Welcome back{user ? `, ${user.firstName}` : ''}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-semibold select-none">
          {user ? getInitials(`${user.firstName} ${user.lastName}`) : '?'}
        </div>
      </div>
    </header>
  );
}
