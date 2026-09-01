'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  FileText,
  FileCheck,
  Files,
  Receipt,
  Cpu,
  LifeBuoy,
  Bell,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLogout } from '@/lib/api/hooks/use-auth';
import { toast } from 'sonner';
import { portalNav } from '@/config/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUIStore } from '@/stores/ui-store';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  FileText,
  FileCheck,
  Files,
  Receipt,
  Cpu,
  LifeBuoy,
  Bell,
};

export function PortalSidebar() {
  const pathname = usePathname();
  const logout = useLogout();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch {
      /* ignore */
    }
    router.push('/auth/login');
    toast.success('Signed out');
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarCollapsed();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebarCollapsed]);

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          'hidden md:flex shrink-0 flex-col border-r border-border bg-card transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-[72px]' : 'w-60',
        )}
      >
        {/* Brand & Toggle */}
        <div
          className={cn(
            'flex items-center border-b border-border transition-all duration-300',
            sidebarCollapsed
              ? 'p-3 flex-col gap-2 justify-center'
              : 'px-5 py-4 justify-between',
          )}
        >
          <Link
            href="/portal"
            className={cn(
              'flex items-center gap-3 overflow-hidden',
              sidebarCollapsed && 'mx-auto justify-center',
            )}
            aria-label="Green Ngoria — client portal home"
          >
            {sidebarCollapsed ? (
              <Logo markOnly height={32} />
            ) : (
              <Logo height={36} />
            )}
          </Link>

          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Collapse sidebar (Ctrl+B)"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav
          className={cn(
            'flex-1 overflow-y-auto py-3 space-y-1 scrollbar-thin',
            sidebarCollapsed ? 'px-2' : 'px-3',
          )}
          role="navigation"
          aria-label="Portal navigation"
        >
          {portalNav.map(({ label, href, icon }) => {
            const Icon = ICON_MAP[icon] ?? LayoutDashboard;
            const active =
              href === '/portal' ? pathname === href : pathname.startsWith(href);

            if (sidebarCollapsed) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={href}
                      className={cn(
                        'group relative flex h-10 w-10 items-center justify-center rounded-xl mx-auto transition-all duration-200',
                        active
                          ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-brand-500" />
                      )}
                      <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12}>
                    <div className="font-semibold text-xs">{label}</div>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-2 shrink-0 space-y-1">
          {sidebarCollapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleSidebarCollapsed}
                    className="flex h-10 w-10 items-center justify-center rounded-xl mx-auto text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                  >
                    <PanelLeftOpen className="h-4.5 w-4.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  <div className="font-semibold text-xs">Expand sidebar (Ctrl+B)</div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => void handleLogout()}
                    className="flex h-10 w-10 items-center justify-center rounded-xl mx-auto text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  <div className="font-semibold text-xs">Sign out</div>
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <button
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                Sign out
              </button>
              <button
                type="button"
                onClick={toggleSidebarCollapsed}
                className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <PanelLeftClose className="h-3.5 w-3.5" />
                  Collapse
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/60 border border-hairline px-1 rounded">
                  Ctrl+B
                </span>
              </button>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
