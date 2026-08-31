'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  UsersRound,
  Building2,
  MapPin,
  ClipboardList,
  FolderKanban,
  FileText,
  FileCheck,
  FileBarChart,
  Files,
  ScrollText,
  Truck,
  Receipt,
  CreditCard,
  Cpu,
  LifeBuoy,
  Lock,
  History,
  Settings,
  LogOut,
  ChevronDown,
  Boxes,
  Warehouse,
  Calculator,
  CalendarClock,
  CalendarDays,
  ShoppingBag,
  Coins,
  HandCoins,
  BadgeDollarSign,
  Wallet,
  Landmark,
  PackageCheck,
  FlaskConical,
  Mountain,
  ShieldAlert,
  IdCard,
  UserCheck,
  Bell,
  Cog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLogout } from '@/lib/api/hooks/use-auth';
import { toast } from 'sonner';
import { adminNav, isNavGroup, type AdminNavItem } from '@/config/navigation';
import { Logo } from '@/components/brand/logo';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  BarChart3,
  Users,
  UsersRound,
  Building2,
  MapPin,
  ClipboardList,
  FolderKanban,
  FileText,
  FileCheck,
  FileBarChart,
  Files,
  ScrollText,
  Truck,
  Receipt,
  CreditCard,
  Cpu,
  LifeBuoy,
  Lock,
  History,
  Settings,
  Cog,
  Boxes,
  Warehouse,
  Calculator,
  CalendarClock,
  CalendarDays,
  ShoppingBag,
  Coins,
  HandCoins,
  BadgeDollarSign,
  Wallet,
  Landmark,
  PackageCheck,
  FlaskConical,
  Mountain,
  ShieldAlert,
  IdCard,
  UserCheck,
  Bell,
};

function iconFor(name?: string) {
  return (name && ICON_MAP[name]) || LayoutDashboard;
}

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== '/admin' && pathname.startsWith(href));
}

function groupIsActive(pathname: string, item: AdminNavItem) {
  if (!isNavGroup(item)) return false;
  return item.children.some((child) => isActive(pathname, child.href));
}

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useLogout();
  const router = useRouter();

  // Groups start open when they contain the active route.
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const item of adminNav) {
      if (isNavGroup(item)) initial[item.label] = groupIsActive(pathname, item);
    }
    return initial;
  });

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch {
      /* ignore */
    }
    router.push('/auth/admin');
    toast.success('Signed out');
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card overflow-hidden">
      {/* Brand */}
      <Link
        href="/admin"
        className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0"
        aria-label="Green Ngoria — admin home"
      >
        <Logo height={30} />
      </Link>

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5"
        role="navigation"
        aria-label="Admin navigation"
      >
        {adminNav.map((item) => {
          if (!isNavGroup(item)) {
            const Icon = iconFor(item.icon);
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          }

          const Icon = iconFor(item.icon);
          const expanded = open[item.label] ?? false;
          const active = groupIsActive(pathname, item);
          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() =>
                  setOpen((s) => ({ ...s, [item.label]: !expanded }))
                }
                aria-expanded={expanded}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active && !expanded
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate flex-1 text-left">{item.label}</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 transition-transform',
                    expanded && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>
              {expanded && (
                <div className="mt-0.5 ml-3 space-y-0.5 border-l border-border pl-2">
                  {item.children.map((child) => {
                    const ChildIcon = iconFor(child.icon);
                    const childActive = isActive(pathname, child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                          childActive
                            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                        aria-current={childActive ? 'page' : undefined}
                      >
                        <ChildIcon
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="truncate flex-1">{child.label}</span>
                        {child.badge && (
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                              child.badge === 'NEW'
                                ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400'
                                : 'bg-sky-400/20 text-sky-600 dark:text-sky-400',
                            )}
                          >
                            {child.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2 shrink-0">
        <button
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
