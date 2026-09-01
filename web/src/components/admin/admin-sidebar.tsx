'use client';

import { useState, useEffect, useMemo } from 'react';
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
  ShieldCheck,
  IdCard,
  UserCheck,
  Bell,
  Cog,
  Menu,
  X,
  ChevronRight,
  Hammer,
  Wrench,
  Globe,
  Image,
  Activity,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useLogout, useMe } from '@/lib/api/hooks/use-auth';
import { toast } from 'sonner';
import {
  adminNav,
  isNavGroup,
  type AdminNavItem,
  filterNavForRoles,
  getPrimaryRoleCategory,
} from '@/config/navigation';
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
  ShieldCheck,
  IdCard,
  UserCheck,
  Bell,
  Hammer,
  Wrench,
  Globe,
  Image,
  Activity,
  Sparkles,
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

/* ── Mobile toggle context ────────────────────────────────────────────── */

let _mobileOpen = false;
let _setMobileOpen: ((v: boolean) => void) | null = null;

export function useMobileSidebar() {
  return {
    open: _mobileOpen,
    toggle: () => _setMobileOpen?.(!_mobileOpen),
    close: () => _setMobileOpen?.(false),
  };
}

/* ── Sidebar content (shared between desktop and mobile) ─────────────── */

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const logout = useLogout();
  const router = useRouter();
  const { data: user } = useMe();
  const userRoles = user?.roles ?? [];

  // Filter navigation specific to user's assigned roles
  const filteredNav = useMemo(() => {
    return filterNavForRoles(adminNav, userRoles);
  }, [userRoles]);

  const roleCategory = useMemo(() => {
    return getPrimaryRoleCategory(userRoles);
  }, [userRoles]);

  const roleBadgeText = {
    sales: 'Sales Workspace',
    pm: 'Project Delivery',
    engineering: 'Engineering & Metallurgy',
    executive: 'Enterprise Admin',
  }[roleCategory];

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
    <>
      {/* Brand & Persona Badge */}
      <div className="px-5 py-4 border-b border-white/[0.06] shrink-0 space-y-2">
        <Link
          href="/admin"
          className="flex items-center gap-3"
          aria-label="Green Ngoria — admin home"
          onClick={onNavigate}
        >
          <Logo height={36} />
        </Link>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            {roleBadgeText}
          </span>
          {user?.firstName && (
            <span className="text-[11px] text-muted-foreground truncate max-w-[100px]">
              {user.firstName}
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin"
        role="navigation"
        aria-label="Admin navigation"
      >
        {filteredNav.map((item) => {
          if (!isNavGroup(item)) {
            const Icon = iconFor(item.icon);
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                    : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-teal-500"
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 35,
                    }}
                  />
                )}
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
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  active && !expanded
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate flex-1 text-left">{item.label}</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                    expanded && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-0.5 ml-3 space-y-0.5 border-l border-white/[0.08] pl-2">
                      {item.children.map((child) => {
                        const ChildIcon = iconFor(child.icon);
                        const childActive = isActive(pathname, child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onNavigate}
                            className={cn(
                              'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-all duration-200',
                              childActive
                                ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 font-medium'
                                : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground',
                            )}
                            aria-current={childActive ? 'page' : undefined}
                          >
                            <ChildIcon
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="truncate flex-1">
                              {child.label}
                            </span>
                            {child.badge && (
                              <span
                                className={cn(
                                  'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                                  child.badge === 'NEW'
                                    ? 'bg-teal-400/20 text-teal-600 dark:text-teal-400'
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-2 shrink-0">
        <button
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </>
  );
}

/* ── Desktop sidebar ──────────────────────────────────────────────────── */

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Register mobile state globally
  useEffect(() => {
    _mobileOpen = mobileOpen;
    _setMobileOpen = setMobileOpen;
    return () => {
      _setMobileOpen = null;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Desktop — always visible ≥ md */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-card/80 backdrop-blur-xl overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg shadow-teal-600/25 md:hidden transition-transform hover:scale-105 active:scale-95"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-card/95 backdrop-blur-2xl border-r border-white/[0.06] shadow-2xl md:hidden"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 transition-colors"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
