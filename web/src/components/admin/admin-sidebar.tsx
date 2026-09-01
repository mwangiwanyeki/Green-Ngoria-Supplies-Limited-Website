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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as Popover from '@radix-ui/react-popover';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUIStore } from '@/stores/ui-store';

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

interface SidebarContentProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}

function SidebarContent({
  collapsed = false,
  onNavigate,
  onToggleCollapse,
}: SidebarContentProps) {
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
    <TooltipProvider delayDuration={150}>
      {/* Brand & Persona Badge Header */}
      <div
        className={cn(
          'border-b border-white/[0.06] shrink-0 transition-all duration-300',
          collapsed ? 'p-3 flex flex-col items-center gap-2' : 'px-5 py-4 space-y-2',
        )}
      >
        <div className="flex items-center justify-between w-full">
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 overflow-hidden',
              collapsed && 'mx-auto justify-center',
            )}
            aria-label="Green Ngoria — admin home"
            onClick={onNavigate}
          >
            {collapsed ? (
              <Logo markOnly height={32} />
            ) : (
              <Logo height={36} />
            )}
          </Link>

          {!collapsed && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Collapsed vs Expanded Badge */}
        {!collapsed && (
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
              {roleBadgeText}
            </span>
            {user?.firstName && (
              <span className="text-[11px] text-muted-foreground truncate max-w-[90px]">
                {user.firstName}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav
        className={cn(
          'flex-1 overflow-y-auto py-3 space-y-1 scrollbar-thin',
          collapsed ? 'px-2' : 'px-2 space-y-0.5',
        )}
        role="navigation"
        aria-label="Admin navigation"
      >
        {filteredNav.map((item) => {
          /* ── Single Nav Item (No sub-items) ── */
          if (!isNavGroup(item)) {
            const Icon = iconFor(item.icon);
            const active = isActive(pathname, item.href);

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'group relative flex h-10 w-10 items-center justify-center rounded-xl mx-auto transition-all duration-200',
                        active
                          ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 shadow-sm'
                          : 'text-muted-foreground hover:bg-white/[0.08] hover:text-foreground',
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-teal-500" />
                      )}
                      <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12}>
                    <div className="font-semibold text-xs">{item.label}</div>
                  </TooltipContent>
                </Tooltip>
              );
            }

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

          /* ── Group Nav Item (with children) ── */
          const Icon = iconFor(item.icon);
          const expanded = open[item.label] ?? false;
          const active = groupIsActive(pathname, item);

          // In Collapsed Mode: Render as Radix Popover with floating sub-menu
          if (collapsed) {
            return (
              <Popover.Root key={item.label}>
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-label={item.label}
                    title={item.label}
                    className={cn(
                      'group relative flex h-10 w-10 items-center justify-center rounded-xl mx-auto transition-all duration-200',
                      active
                        ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 shadow-sm'
                        : 'text-muted-foreground hover:bg-white/[0.08] hover:text-foreground',
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-teal-500" />
                    )}
                    <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                  </button>
                </Popover.Trigger>

                <Popover.Portal>
                  <Popover.Content
                    side="right"
                    sideOffset={14}
                    align="start"
                    className="z-50 w-56 rounded-xl border border-hairline bg-card/95 p-2 text-card-foreground shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95"
                  >
                    <div className="px-2.5 py-1.5 border-b border-hairline/60 mb-1">
                      <div className="text-xs font-bold text-foreground">{item.label}</div>
                      <div className="text-[10px] text-muted-foreground">Functional section</div>
                    </div>
                    <div className="space-y-0.5">
                      {item.children.map((child) => {
                        const ChildIcon = iconFor(child.icon);
                        const childActive = isActive(pathname, child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onNavigate}
                            className={cn(
                              'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors',
                              childActive
                                ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 font-medium'
                                : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground',
                            )}
                          >
                            <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate flex-1">{child.label}</span>
                            {child.badge && (
                              <span className="rounded bg-teal-500/20 px-1 py-0.2 text-[9px] font-bold text-teal-600 dark:text-teal-400">
                                {child.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            );
          }

          // In Expanded Mode: Render full accordion dropdown
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

      {/* Footer: Sign out & Expand/Collapse Toggle */}
      <div className="border-t border-white/[0.06] p-2 shrink-0 space-y-1">
        {collapsed ? (
          <>
            {onToggleCollapse && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="flex h-10 w-10 items-center justify-center rounded-xl mx-auto text-muted-foreground hover:bg-white/[0.08] hover:text-foreground transition-all"
                  >
                    <PanelLeftOpen className="h-4.5 w-4.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  <div className="font-semibold text-xs">Expand sidebar</div>
                </TooltipContent>
              </Tooltip>
            )}

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
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              Sign out
            </button>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <PanelLeftClose className="h-3.5 w-3.5" />
                  Collapse sidebar
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/60 border border-hairline px-1 rounded">
                  Ctrl+B
                </span>
              </button>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

/* ── Desktop sidebar ──────────────────────────────────────────────────── */

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  // Register mobile state globally
  useEffect(() => {
    _mobileOpen = mobileOpen;
    _setMobileOpen = setMobileOpen;
    return () => {
      _setMobileOpen = null;
    };
  }, [mobileOpen]);

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
    <>
      {/* Desktop — always visible ≥ md, dynamic collapsible width */}
      <aside
        className={cn(
          'hidden md:flex shrink-0 flex-col border-r border-white/[0.06] bg-card/80 backdrop-blur-xl overflow-hidden transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <SidebarContent
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />
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
              <SidebarContent
                collapsed={false}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
