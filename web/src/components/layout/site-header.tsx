'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ServiceIcon } from '@/components/marketing/service-icon';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { publicSiteNav, type PublicNavItem } from '@/config/public-nav';
import { company } from '@/config/company';
import { Logo } from '@/components/brand/logo';

/* ── Brand mark ─────────────────────────────────────────────────── */

/* ── Utilities ──────────────────────────────────────────────────── */

function useIsActive() {
  const pathname = usePathname() ?? '/';
  return React.useCallback(
    (item: PublicNavItem) => {
      const hrefs = [
        item.href,
        ...(item.children?.map((c) => c.href) ?? []),
        ...(item.columns?.flatMap((c) => c.links.map((l) => l.href)) ?? []),
      ];
      return hrefs.some(
        (href) =>
          href !== '/' &&
          (pathname === href || pathname.startsWith(`${href}/`)),
      );
    },
    [pathname],
  );
}

/* ── Desktop panels ─────────────────────────────────────────────── */

function MegaPanel({
  item,
  onNavigate,
}: {
  item: PublicNavItem;
  onNavigate: () => void;
}) {
  return (
    <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[repeat(4,minmax(0,1fr))_18rem]">
      {item.columns!.map((column) => (
        <div key={column.heading}>
          <h3 className="tech-label border-b border-hairline pb-3">
            {column.heading}
          </h3>
          <ul className="mt-3 space-y-0.5">
            {column.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className="group/link flex gap-3 rounded-md p-2.5 transition-colors duration-micro ease-out-expo hover:bg-accent focus-visible:bg-accent"
                >
                  {link.icon && (
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-hairline bg-secondary/60 text-muted-foreground transition-colors duration-micro group-hover/link:border-brand-500/40 group-hover/link:text-brand-600 dark:group-hover/link:text-brand-400">
                      <ServiceIcon name={link.icon} className="h-4 w-4" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {link.label}
                    </span>
                    {link.description && (
                      <span className="mt-0.5 block text-xs leading-5 text-subtle">
                        {link.description}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {item.feature && (
        <div className="flex flex-col rounded-lg border border-hairline bg-surface-sunken p-6">
          <h3 className="font-display text-base font-bold">
            {item.feature.title}
          </h3>
          <p className="mt-2 flex-1 text-xs leading-5 text-muted-foreground">
            {item.feature.body}
          </p>
          <Link
            href={item.feature.href}
            onClick={onNavigate}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 underline decoration-brand-600/30 transition-colors hover:decoration-brand-600 dark:text-brand-400 dark:decoration-brand-400/30 dark:hover:decoration-brand-400"
          >
            {item.feature.action}
          </Link>
        </div>
      )}
    </div>
  );
}

function ListPanel({
  item,
  onNavigate,
}: {
  item: PublicNavItem;
  onNavigate: () => void;
}) {
  return (
    <ul className="mx-auto grid max-w-3xl gap-0.5 sm:grid-cols-2">
      {item.children!.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            onClick={onNavigate}
            className="block rounded-md p-3 transition-colors duration-micro ease-out-expo hover:bg-accent focus-visible:bg-accent"
          >
            <span className="block text-sm font-semibold text-foreground">
              {link.label}
            </span>
            {link.description && (
              <span className="mt-0.5 block text-xs leading-5 text-subtle">
                {link.description}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ── Header ─────────────────────────────────────────────────────── */

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = useIsActive();

  const [scrolled, setScrolled] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navRef = React.useRef<HTMLDivElement>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Scroll state — condense and take a solid ground */
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close everything on route change */
  React.useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  /* Escape closes the open panel */
  React.useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openMenu]);

  /* Dismiss the panel when focus or the pointer leaves the nav */
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const transparent = !scrolled && !openMenu && !mobileOpen;

  return (
    <>
      <a
        href="#main"
        className="sr-only left-4 top-4 z-[70] rounded-md bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-high focus:not-sr-only focus:fixed"
      >
        Skip to content
      </a>

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-ui ease-out-expo',
          transparent
            ? 'on-ink border-b border-transparent bg-transparent'
            : 'border-b border-hairline bg-background/85 shadow-low backdrop-blur-xl supports-[backdrop-filter]:bg-background/70',
        )}
      >
        <div
          ref={navRef}
          onMouseLeave={scheduleClose}
          onMouseEnter={cancelClose}
          onBlur={(e) => {
            if (!navRef.current?.contains(e.relatedTarget)) {
              setOpenMenu(null);
            }
          }}
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div
              className={cn(
                'flex items-center justify-between gap-6 transition-[height] duration-ui ease-out-expo',
                scrolled ? 'h-16' : 'h-20',
              )}
            >
              {/* Logo */}
              <Link
                href="/"
                className="group flex shrink-0 items-center rounded-md transition-transform duration-ui ease-out-expo hover:-translate-y-px"
                aria-label={`${company.legalName} — home`}
              >
                <Logo
                  height={scrolled ? 32 : 38}
                  onDark={transparent}
                  priority
                />
              </Link>

              {/* Desktop nav */}
              <nav
                className="hidden items-center lg:flex"
                aria-label="Main navigation"
              >
                {publicSiteNav.map((item) => {
                  const hasPanel = Boolean(item.columns || item.children);
                  const active = isActive(item);
                  const open = openMenu === item.label;

                  if (!hasPanel) {
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onMouseEnter={() => setOpenMenu(null)}
                        className={cn(
                          'relative rounded-md px-3 py-2 text-sm font-medium transition-colors duration-micro ease-out-expo',
                          transparent
                            ? 'text-white/80 hover:bg-white/10 hover:text-white'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                          active &&
                            (transparent ? 'text-white' : 'text-foreground'),
                        )}
                        aria-current={active ? 'page' : undefined}
                      >
                        {item.label}
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-500 dark:bg-brand-400"
                          />
                        )}
                      </Link>
                    );
                  }

                  return (
                    <div key={item.label} className="relative">
                      <button
                        type="button"
                        onMouseEnter={() => {
                          cancelClose();
                          setOpenMenu(item.label);
                        }}
                        onFocus={() => setOpenMenu(item.label)}
                        onClick={() => setOpenMenu(open ? null : item.label)}
                        aria-expanded={open}
                        aria-haspopup="true"
                        className={cn(
                          'relative flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-micro ease-out-expo',
                          transparent
                            ? 'text-white/80 hover:bg-white/10 hover:text-white'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                          (active || open) &&
                            (transparent ? 'text-white' : 'text-foreground'),
                        )}
                      >
                        {item.label}
                        <ChevronDown
                          aria-hidden="true"
                          className={cn(
                            'h-3.5 w-3.5 opacity-60 transition-transform duration-ui ease-out-expo',
                            open && 'rotate-180 opacity-100',
                          )}
                        />
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-500 dark:bg-brand-400"
                          />
                        )}
                      </button>
                    </div>
                  );
                })}
              </nav>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <div className="hidden lg:block">
                  <ThemeToggle onInk={transparent} />
                </div>
                <Link href="/auth/login" className="hidden lg:block">
                  <Button
                    variant={transparent ? 'on-ink' : 'outline'}
                    size="sm"
                  >
                    Client portal
                  </Button>
                </Link>
                <Link href="/request-rfq" className="hidden sm:block">
                  <Button variant="brand" size="sm">
                    Request a quotation
                  </Button>
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open navigation"
                  aria-expanded={mobileOpen}
                  className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-micro lg:hidden',
                    transparent
                      ? 'text-white hover:bg-white/10 focus-visible:ring-brand-400 focus-visible:ring-offset-[hsl(var(--ink))]'
                      : 'text-foreground hover:bg-accent',
                  )}
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Mega / list panel ───────────────────────────────── */}
          {openMenu && (
            <div className="absolute inset-x-0 top-full hidden lg:block">
              <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
                <div className="animate-panel-in origin-top rounded-b-xl border border-t-0 border-hairline bg-popover p-8 shadow-panel">
                  {publicSiteNav
                    .filter((i) => i.label === openMenu)
                    .map((item) =>
                      item.columns ? (
                        <MegaPanel
                          key={item.label}
                          item={item}
                          onNavigate={() => setOpenMenu(null)}
                        />
                      ) : (
                        <ListPanel
                          key={item.label}
                          item={item}
                          onNavigate={() => setOpenMenu(null)}
                        />
                      ),
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

/* ── Mobile sheet ───────────────────────────────────────────────── */

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-mineral-charcoal/60 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className="animate-sheet-in absolute inset-x-0 top-0 max-h-[100dvh] overflow-y-auto overscroll-contain bg-background pb-10 shadow-panel"
      >
        <div className="flex h-20 items-center justify-between px-5 sm:px-8">
          <span className="font-display text-sm font-bold">Menu</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <nav aria-label="Mobile navigation" className="px-5 sm:px-8">
          <ul className="divide-y divide-hairline border-y border-hairline">
            {publicSiteNav.map((item) => {
              const groups =
                item.columns ??
                (item.children
                  ? [{ heading: '', links: item.children }]
                  : null);
              const isOpen = expanded === item.label;

              if (!groups) {
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="block py-4 font-display text-base font-semibold"
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : item.label)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between py-4 text-left font-display text-base font-semibold"
                  >
                    {item.label}
                    {isOpen ? (
                      <Minus
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    ) : (
                      <Plus
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                  {isOpen && (
                    <div className="animate-fade-in space-y-5 pb-5">
                      {groups.map((group, gi) => (
                        <div key={group.heading || gi}>
                          {group.heading && (
                            <h3 className="tech-label mb-2">{group.heading}</h3>
                          )}
                          <ul className="space-y-1">
                            {group.links.map((link) => (
                              <li key={link.href}>
                                <Link
                                  href={link.href}
                                  onClick={onClose}
                                  className="block rounded-md py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="inline-block text-sm font-semibold text-brand-600 underline decoration-brand-600/30 dark:text-brand-400 dark:decoration-brand-400/30"
                      >
                        {item.label} overview
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-col gap-3">
            <Link href="/request-rfq" onClick={onClose}>
              <Button variant="brand" size="lg" className="w-full">
                Request a quotation
              </Button>
            </Link>
            <Link href="/auth/login" onClick={onClose}>
              <Button variant="outline" size="lg" className="w-full">
                Client portal
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            <a
              href={`tel:${company.contact.phones[0].value.replace(/\s/g, '')}`}
              className="font-medium text-foreground underline decoration-border"
            >
              {company.contact.phones[0].value}
            </a>
            <span className="mx-2 text-border">·</span>
            <a
              href={`mailto:${company.contact.emails[0].value}`}
              className="underline decoration-border"
            >
              {company.contact.emails[0].value}
            </a>
          </p>
        </nav>
      </div>
    </div>
  );
}
