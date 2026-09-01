'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLogout } from '@/lib/api/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { portalNav } from '@/config/navigation';

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

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch {
      /* ignore */
    }
    router.push('/auth/login');
    toast.success('Signed out');
  };

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-card">
      {/* Brand */}
      <Link
        href="/portal"
        className="flex items-center gap-3 px-5 py-5 border-b border-border"
        aria-label="Green Ngoria — client portal home"
      >
        <Logo height={38} />
      </Link>

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5"
        role="navigation"
        aria-label="Portal navigation"
      >
        {portalNav.map(({ label, href, icon }) => {
          const Icon = ICON_MAP[icon] ?? LayoutDashboard;
          const active =
            href === '/portal' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
