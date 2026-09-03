'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useMe } from '@/lib/api/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { getPrimaryRoleCategory, EXECUTIVE_ROLES } from '@/config/navigation';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ShoppingBag, FolderKanban, Cpu, ShieldCheck, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminSalesDashboard = dynamic(
  () =>
    import('./dashboards/admin-sales-dashboard').then(
      (m) => m.AdminSalesDashboard,
    ),
  { loading: () => <PageSkeleton /> },
);

const AdminPmDashboard = dynamic(
  () =>
    import('./dashboards/admin-pm-dashboard').then((m) => m.AdminPmDashboard),
  { loading: () => <PageSkeleton /> },
);

const AdminEngineeringDashboard = dynamic(
  () =>
    import('./dashboards/admin-engineering-dashboard').then(
      (m) => m.AdminEngineeringDashboard,
    ),
  { loading: () => <PageSkeleton /> },
);

const AdminExecutiveDashboard = dynamic(
  () =>
    import('./dashboards/admin-executive-dashboard').then(
      (m) => m.AdminExecutiveDashboard,
    ),
  { loading: () => <PageSkeleton /> },
);

export function AdminDashboard() {
  const { data: user } = useMe();
  const cachedUser = useAuthStore((s) => s.user);
  const userRoles = user?.roles ?? cachedUser?.roles ?? [];

  // Determine user's native role category
  const nativeCategory = useMemo(() => {
    return getPrimaryRoleCategory(userRoles);
  }, [userRoles]);

  const isExecutive = userRoles.some((r) => EXECUTIVE_ROLES.includes(r as any));

  // Active view state (defaults to native category; executives can preview any perspective)
  const [selectedCategory, setSelectedCategory] = useState<
    'executive' | 'sales' | 'pm' | 'engineering' | null
  >(null);

  const activeCategory = selectedCategory ?? nativeCategory;

  return (
    <div className="space-y-6">
      {/* ── Executive Role Preview Switcher (Only visible to Super Admins & Directors) ── */}
      {isExecutive && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-hairline bg-surface-elevated/70 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Eye className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>Executive Role Perspective Preview:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-surface-sunken p-1 rounded-lg border border-hairline">
            <button
              type="button"
              onClick={() => setSelectedCategory('executive')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                activeCategory === 'executive'
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Executive Overview
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('sales')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                activeCategory === 'sales'
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Sales &amp; Commercial
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('pm')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                activeCategory === 'pm'
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <FolderKanban className="h-3.5 w-3.5" />
              Project Delivery (PM)
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('engineering')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                activeCategory === 'engineering'
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Cpu className="h-3.5 w-3.5" />
              Mining &amp; Engineering
            </button>
          </div>
        </div>
      )}

      {/* ── Render Targeted Domain Dashboard ── */}
      {activeCategory === 'sales' && <AdminSalesDashboard />}
      {activeCategory === 'pm' && <AdminPmDashboard />}
      {activeCategory === 'engineering' && <AdminEngineeringDashboard />}
      {activeCategory === 'executive' && <AdminExecutiveDashboard />}
    </div>
  );
}
