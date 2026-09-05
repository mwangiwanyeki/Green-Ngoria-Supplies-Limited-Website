'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, ChevronDown, Menu, Minus, Plus, X } from 'lucide-react';
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

/**
 * Business-oriented mega menu.
 *
 * Layout: four grouped columns on the left, one editorial rail on the right.
 * The rail carries a real Green Ngoria photograph, a short brand line, and
 * the promoted action from the nav config — turning the dropdown into a
 * miniature landing panel rather than a bare link list.
 */
function MegaPanel({
  item,
  onNavigate,
}: {
  item: PublicNavItem;
  onNavigate: () => void;
}) {
  const totalLinks = item.columns!.reduce((n, c) => n + c.links.length, 0);
  return (
    <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[repeat(4,minmax(0,1fr))_20rem]">
      {item.columns!.map((column, ci) => (
        <div key={column.heading} className="min-w-0">
          <div className="flex items-baseline gap-2 border-b border-hairline pb-3">
            <span className="font-mono text-[0.6rem] font-semibold text-brand-600/80 dark:text-brand-400/80">
              {String(ci + 1).padStart(2, '0')}
            </span>
            <h3 className="tech-label text-foreground">{column.heading}</h3>
          </div>
          <ul className="mt-3 space-y-0.5">
            {column.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className="group/link relative flex gap-3 rounded-lg p-2.5 transition-all duration-ui ease-out-expo hover:-translate-y-px hover:bg-surface-sunken focus-visible:bg-surface-sunken"
                >
                  {link.icon && (
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-secondary/60 text-muted-foreground transition-colors duration-ui group-hover/link:border-brand-500/50 group-hover/link:bg-brand-500/10 group-hover/link:text-brand-600 dark:group-hover/link:text-brand-400">
                      <ServiceIcon name={link.icon} className="h-4 w-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-foreground transition-colors group-hover/link:text-brand-700 dark:group-hover/link:text-brand-300">
                        {link.label}
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 text-brand-600/0 transition-all duration-ui group-hover/link:text-brand-600 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 dark:group-hover/link:text-brand-400"
                      />
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

      <EditorialRail
        item={item}
        onNavigate={onNavigate}
        eyebrowFallback={`${totalLinks} divisions · one team`}
      />
    </div>
  );
}

/**
 * Shared editorial side rail: photograph + chip caption + eyebrow +
 * title + body + brand CTA. Used by both the mega and list panels so
 * every dropdown reads as one system.
 */
function EditorialRail({
  item,
  onNavigate,
  eyebrowFallback,
}: {
  item: PublicNavItem;
  onNavigate: () => void;
  eyebrowFallback: string;
}) {
  const image = item.feature?.image ?? '/images/gallery/dji-0333.webp';
  const caption = item.feature?.imageCaption ?? 'Green Ngoria · Bondo plant';
  const eyebrow = item.feature?.eyebrow ?? eyebrowFallback;
  const title =
    item.feature?.title ??
    'Every division headed by a qualified engineer';
  const body = item.feature?.body;
  const href = item.feature?.href ?? item.href;
  const action = item.feature?.action ?? `${item.label} overview`;

  return (
    <aside className="group/rail relative flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface-sunken">
      <div className="relative h-40 w-full overflow-hidden">
        <Image
          src={image}
          alt=""
          fill
          sizes="320px"
          className="object-cover transition-transform duration-[900ms] ease-out group-hover/rail:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/70" />
        <span className="absolute left-4 top-4 rounded-full bg-black/55 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
          {caption}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <span className="tech-label text-brand-700 dark:text-brand-400">
          {eyebrow}
        </span>
        <h3 className="mt-2 font-display text-base font-bold tracking-tight text-foreground">
          {title}
        </h3>
        {body && (
          <p className="mt-2 flex-1 text-xs leading-5 text-muted-foreground">
            {body}
          </p>
        )}
        <Link
          href={href}
          onClick={onNavigate}
          className="group/cta mt-5 inline-flex items-center gap-1.5 self-start rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-semibold text-black shadow-sm transition-all duration-ui hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-md focus-visible:-translate-y-0.5"
        >
          {action}
          <ArrowUpRight
            aria-hidden="true"
            className="h-3.5 w-3.5 transition-transform duration-ui group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5"
          />
        </Link>
      </div>
    </aside>
  );
}

/**
 * Two-column list panel for menus that don't have grouped sub-columns
 * (Mining & processing, Engineering, Company). Uses the same editorial
 * rail as the Services mega panel so every dropdown reads as one system.
 */
function ListPanel({
  item,
  onNavigate,
}: {
  item: PublicNavItem;
  onNavigate: () => void;
}) {
  return (
    <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2 border-b border-hairline pb-3">
          <span className="font-mono text-[0.6rem] font-semibold text-brand-600/80 dark:text-brand-400/80">
            01
          </span>
          <h3 className="tech-label text-foreground">
            {item.label} · {item.children!.length} pages
          </h3>
        </div>
        <ul className="mt-3 grid gap-1 sm:grid-cols-2">
          {item.children!.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onNavigate}
                className="group/link relative flex items-start gap-3 rounded-lg p-2.5 transition-all duration-ui ease-out-expo hover:-translate-y-px hover:bg-surface-sunken focus-visible:bg-surface-sunken"
              >
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500/70 transition-all duration-ui group-hover/link:h-2 group-hover/link:w-2 group-hover/link:bg-brand-500"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-foreground transition-colors group-hover/link:text-brand-700 dark:group-hover/link:text-brand-300">
                      {link.label}
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 text-brand-600/0 transition-all duration-ui group-hover/link:text-brand-600 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 dark:group-hover/link:text-brand-400"
                    />
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

      <EditorialRail
        item={item}
        onNavigate={onNavigate}
        eyebrowFallback={`${item.children!.length} pages · one section`}
      />
    </div>
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
                  height={scrolled ? 42 : 52}
                  onDark={transparent ? true : undefined}
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
          <Link
            href="/"
            onClick={onClose}
            aria-label={`${company.legalName} — home`}
            className="flex shrink-0 items-center"
          >
            <Logo height={42} />
          </Link>
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
                            <div className="mb-2 flex items-baseline gap-2">
                              <span className="font-mono text-[0.6rem] font-semibold text-brand-600/80 dark:text-brand-400/80">
                                {String(gi + 1).padStart(2, '0')}
                              </span>
                              <h3 className="tech-label">{group.heading}</h3>
                            </div>
                          )}
                          <ul className="space-y-0.5">
                            {group.links.map((link) => (
                              <li key={link.href}>
                                <Link
                                  href={link.href}
                                  onClick={onClose}
                                  className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-surface-sunken"
                                >
                                  {link.icon && (
                                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-hairline bg-secondary/60 text-muted-foreground">
                                      <ServiceIcon
                                        name={link.icon}
                                        className="h-4 w-4"
                                      />
                                    </span>
                                  )}
                                  <span className="min-w-0 flex-1">
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
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400"
                      >
                        <span className="border-b border-brand-600/30 pb-px dark:border-brand-400/30">
                          {item.label} overview
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
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
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            <a
              href={`tel:${company.customerCare.phone.replace(/\s/g, '')}`}
              className="font-medium text-foreground underline decoration-border"
            >
              {company.customerCare.phone}
            </a>
            <span className="mx-2 text-border">·</span>
            <a
              href={`mailto:${company.customerCare.email}`}
              className="underline decoration-border"
            >
              {company.customerCare.email}
            </a>
          </p>
        </nav>
      </div>
    </div>
  );
}
