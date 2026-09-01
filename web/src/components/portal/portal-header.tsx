'use client';

import { Bell, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/api/hooks/use-auth';
import { getInitials } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';

export function PortalHeader() {
  const { data: user } = useMe();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          className="hidden md:flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
          title={sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>

        <div className="text-sm text-muted-foreground">
          Welcome back{user ? `, ${user.firstName}` : ''}
        </div>
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
