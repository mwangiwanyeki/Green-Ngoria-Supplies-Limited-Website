export const publicNav = [
  { label: 'Mining & Processing', href: '/mining' },
  {
    label: 'Solutions',
    href: '/services',
    children: [
      { label: 'Gold Processing (CIP/CIL)', href: '/gold-processing' },
      { label: 'Mining Plant Engineering', href: '/mining-plant-engineering' },
      { label: 'Plant Construction', href: '/mining-plant-construction' },
      { label: 'Plant Optimization', href: '/plant-optimization' },
      { label: 'Technical Assessment', href: '/technical-assessment' },
      { label: 'Commissioning', href: '/services#commissioning' },
      { label: 'Maintenance', href: '/services#maintenance' },
    ],
  },
  {
    label: 'Equipment',
    href: '/equipment',
    children: [
      { label: 'Equipment Catalogue', href: '/equipment' },
      { label: 'Spare Parts', href: '/spares' },
      { label: 'Request RFQ', href: '/request-rfq' },
    ],
  },
  { label: 'Projects', href: '/projects' },
  { label: 'About', href: '/about' },
  { label: 'Insights', href: '/insights' },
  { label: 'Contact', href: '/contact' },
] as const;

export const portalNav = [
  { label: 'Dashboard', href: '/portal', icon: 'LayoutDashboard' },
  { label: 'Projects', href: '/portal/projects', icon: 'FolderKanban' },
  { label: 'Assessments', href: '/portal/assessments', icon: 'ClipboardList' },
  { label: 'RFQs', href: '/portal/rfqs', icon: 'FileText' },
  { label: 'Quotations', href: '/portal/quotations', icon: 'FileCheck' },
  { label: 'Documents', href: '/portal/documents', icon: 'Files' },
  { label: 'Invoices', href: '/portal/invoices', icon: 'Receipt' },
  { label: 'Assets', href: '/portal/assets', icon: 'Cpu' },
  { label: 'Support', href: '/portal/support', icon: 'LifeBuoy' },
  { label: 'Notifications', href: '/portal/notifications', icon: 'Bell' },
  { label: 'Profile', href: '/portal/profile', icon: 'UserRound' },
] as const;

// ─── Role constants for access segmentation ───────────────────────────────────

export const EXECUTIVE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'DIRECTOR',
  'MANAGING_DIRECTOR',
] as const;

export const SALES_ROLES = [
  'SALES_MANAGER',
  'CRM_OFFICER',
  'CUSTOMER_CARE',
] as const;

export const PM_ROLES = [
  'PROJECT_MANAGER',
  'SITE_SUPERVISOR',
  'PRODUCTION_MANAGER',
] as const;

export const ENGINEERING_ROLES = [
  'MINING_ENGINEER',
  'PROCESS_ENGINEER',
  'MECHANICAL_ENGINEER',
  'ELECTRICAL_ENGINEER',
] as const;

export const FINANCE_ROLES = [
  'FINANCE_OFFICER',
  'ACCOUNTANT',
] as const;

export const PROCUREMENT_ROLES = [
  'PROCUREMENT_OFFICER',
] as const;

export const HSE_ROLES = [
  'HSE_OFFICER',
] as const;

// ─── Admin (ERP) navigation ────────────────────────────────────────────────
// Structure derived from company ERP specification with role-based visibility.

export type AdminBadge = 'NEW' | 'UPDATED';

export interface AdminNavLeaf {
  label: string;
  href: string;
  icon?: string;
  badge?: AdminBadge;
  allowedRoles?: readonly string[];
}

export interface AdminNavGroup {
  label: string;
  icon?: string;
  badge?: AdminBadge;
  allowedRoles?: readonly string[];
  children: AdminNavLeaf[];
}

export type AdminNavItem = AdminNavLeaf | AdminNavGroup;

export const adminNav: readonly AdminNavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: 'LayoutDashboard',
    // All internal admin roles have a dashboard (content is role-personalized)
  },

  // ── CRM & Commercial (Sales, PM, Executive) ──
  {
    label: 'CRM',
    icon: 'Users',
    allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES, 'PROJECT_MANAGER'],
    children: [
      {
        label: 'Leads',
        href: '/admin/leads',
        icon: 'Users',
        badge: 'NEW',
        allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES],
      },
      {
        label: 'Clients',
        href: '/admin/clients',
        icon: 'Building2',
        allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES, 'PROJECT_MANAGER'],
      },
      {
        label: 'Organizations',
        href: '/admin/organizations',
        icon: 'Building2',
        badge: 'NEW',
        allowedRoles: [...EXECUTIVE_ROLES, 'SALES_MANAGER'],
      },
      {
        label: 'Consultations',
        href: '/admin/consultations',
        icon: 'CalendarClock',
        allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES, ...ENGINEERING_ROLES],
      },
    ],
  },
  {
    label: 'Commercial',
    icon: 'FileCheck',
    allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES, ...PM_ROLES, ...FINANCE_ROLES],
    children: [
      {
        label: 'Quotations',
        href: '/admin/quotations',
        icon: 'FileCheck',
        badge: 'NEW',
        allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES, ...PM_ROLES, ...FINANCE_ROLES],
      },
      {
        label: 'Contracts',
        href: '/admin/contracts',
        icon: 'ScrollText',
        allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES, ...PM_ROLES, 'LEGAL_OFFICER'],
      },
      {
        label: 'RFQs',
        href: '/admin/rfqs',
        icon: 'FileText',
        allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES, ...PM_ROLES, ...PROCUREMENT_ROLES],
      },
    ],
  },

  // ── Projects & Engineering ──
  {
    label: 'Projects',
    href: '/admin/projects',
    icon: 'FolderKanban',
    badge: 'NEW',
    allowedRoles: [...EXECUTIVE_ROLES, ...PM_ROLES, ...ENGINEERING_ROLES],
  },
  {
    label: 'Site Operations',
    href: '/admin/site-ops',
    icon: 'Hammer',
    badge: 'NEW',
    allowedRoles: [...EXECUTIVE_ROLES, ...PM_ROLES, ...HSE_ROLES, 'MINING_ENGINEER'],
  },
  {
    label: 'Engineering',
    icon: 'Cpu',
    allowedRoles: [...EXECUTIVE_ROLES, ...ENGINEERING_ROLES, 'PROJECT_MANAGER', 'PRODUCTION_MANAGER'],
    children: [
      {
        label: 'Assessments',
        href: '/admin/assessments',
        icon: 'ClipboardList',
        allowedRoles: [...EXECUTIVE_ROLES, ...ENGINEERING_ROLES, 'PROJECT_MANAGER'],
      },
      {
        label: 'Documents',
        href: '/admin/engineering',
        icon: 'Files',
        allowedRoles: [...EXECUTIVE_ROLES, ...ENGINEERING_ROLES, 'PROJECT_MANAGER'],
      },
      {
        label: 'Mining Sites',
        href: '/admin/mining-sites',
        icon: 'MapPin',
        allowedRoles: [...EXECUTIVE_ROLES, ...ENGINEERING_ROLES, ...PM_ROLES],
      },
      {
        label: 'Equipment',
        href: '/admin/equipment',
        icon: 'Boxes',
        allowedRoles: [...EXECUTIVE_ROLES, ...ENGINEERING_ROLES, ...PM_ROLES, ...SALES_ROLES],
      },
      {
        label: 'Spares',
        href: '/admin/spares',
        icon: 'PackageCheck',
        allowedRoles: [...EXECUTIVE_ROLES, ...ENGINEERING_ROLES, ...PM_ROLES, ...SALES_ROLES],
      },
      {
        label: 'Commissioning',
        href: '/admin/commissioning',
        icon: 'FileCheck',
        allowedRoles: [...EXECUTIVE_ROLES, ...ENGINEERING_ROLES, ...PM_ROLES],
      },
      {
        label: 'Plant Assets',
        href: '/admin/assets',
        icon: 'Cpu',
        allowedRoles: [...EXECUTIVE_ROLES, ...ENGINEERING_ROLES, ...PM_ROLES],
      },
      {
        label: 'Maintenance',
        href: '/admin/maintenance',
        icon: 'Wrench',
        allowedRoles: [...EXECUTIVE_ROLES, ...ENGINEERING_ROLES, ...PM_ROLES],
      },
      {
        label: 'Warranties',
        href: '/admin/warranties',
        icon: 'ShieldCheck',
        allowedRoles: [...EXECUTIVE_ROLES, ...ENGINEERING_ROLES, ...PM_ROLES],
      },
    ],
  },

  // ── Operations & Plants ──
  {
    label: 'Operations',
    icon: 'Cog',
    allowedRoles: [...EXECUTIVE_ROLES, ...PM_ROLES, ...ENGINEERING_ROLES, ...HSE_ROLES, ...PROCUREMENT_ROLES],
    children: [
      {
        label: 'HSE',
        href: '/admin/hse',
        icon: 'ShieldAlert',
        allowedRoles: [...EXECUTIVE_ROLES, ...HSE_ROLES, ...PM_ROLES, ...ENGINEERING_ROLES],
      },
      {
        label: 'Procurement',
        href: '/admin/procurement',
        icon: 'Truck',
        allowedRoles: [...EXECUTIVE_ROLES, ...PROCUREMENT_ROLES, ...PM_ROLES, ...FINANCE_ROLES],
      },
      {
        label: 'Vendors',
        href: '/admin/vendors',
        icon: 'Building2',
        allowedRoles: [...EXECUTIVE_ROLES, ...PROCUREMENT_ROLES, ...PM_ROLES],
      },
      {
        label: 'Vat Leach',
        href: '/admin/vat-leach',
        icon: 'FlaskConical',
        badge: 'UPDATED',
        allowedRoles: [...EXECUTIVE_ROLES, ...ENGINEERING_ROLES, 'PRODUCTION_MANAGER'],
      },
      {
        label: 'Stock Pile',
        href: '/admin/stock-piles',
        icon: 'Mountain',
        badge: 'NEW',
        allowedRoles: [...EXECUTIVE_ROLES, ...ENGINEERING_ROLES, ...PM_ROLES, 'PRODUCTION_MANAGER'],
      },
      {
        label: 'Security',
        href: '/admin/security',
        icon: 'ShieldAlert',
        badge: 'NEW',
        allowedRoles: [...EXECUTIVE_ROLES, ...PM_ROLES, 'SITE_SUPERVISOR'],
      },
    ],
  },

  // ── Sales & Store ERP (Sales Manager, Store Cashier, Executive) ──
  {
    label: 'Sales & POS',
    icon: 'ShoppingBag',
    allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES, ...FINANCE_ROLES],
    children: [
      {
        label: 'POS Register',
        href: '/admin/pos',
        icon: 'Calculator',
        badge: 'UPDATED',
        allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES, ...FINANCE_ROLES],
      },
      {
        label: 'Today Sales',
        href: '/admin/today-sales',
        icon: 'CalendarClock',
        allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES, ...FINANCE_ROLES],
      },
      {
        label: 'All Sales',
        href: '/admin/all-sales',
        icon: 'Receipt',
        allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES, ...FINANCE_ROLES],
      },
      {
        label: 'Inventory',
        href: '/admin/inventory',
        icon: 'Boxes',
        allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES, ...PM_ROLES, ...PROCUREMENT_ROLES],
      },
      {
        label: 'Store Management',
        href: '/admin/store-management',
        icon: 'Warehouse',
        allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES, ...PROCUREMENT_ROLES],
      },
      {
        label: 'Customers',
        href: '/admin/customers',
        icon: 'Users',
        allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES, ...FINANCE_ROLES],
      },
      {
        label: 'Manage Debt',
        href: '/admin/manage-debt',
        icon: 'Coins',
        allowedRoles: [...EXECUTIVE_ROLES, ...SALES_ROLES, ...FINANCE_ROLES],
      },
    ],
  },

  // ── Finance (Finance Officer, Executives) ──
  {
    label: 'Finance',
    icon: 'Landmark',
    allowedRoles: [...EXECUTIVE_ROLES, ...FINANCE_ROLES],
    children: [
      {
        label: 'Invoices',
        href: '/admin/invoices',
        icon: 'Receipt',
        allowedRoles: [...EXECUTIVE_ROLES, ...FINANCE_ROLES, 'SALES_MANAGER', 'PROJECT_MANAGER'],
      },
      {
        label: 'Payments',
        href: '/admin/payments',
        icon: 'CreditCard',
        allowedRoles: [...EXECUTIVE_ROLES, ...FINANCE_ROLES],
      },
      {
        label: 'Accounts',
        href: '/admin/accounts',
        icon: 'Landmark',
        allowedRoles: [...EXECUTIVE_ROLES, ...FINANCE_ROLES],
      },
      {
        label: 'Expenses',
        href: '/admin/expenses',
        icon: 'Wallet',
        allowedRoles: [...EXECUTIVE_ROLES, ...FINANCE_ROLES, 'PROJECT_MANAGER'],
      },
      {
        label: 'Suppliers',
        href: '/admin/suppliers',
        icon: 'Truck',
        allowedRoles: [...EXECUTIVE_ROLES, ...FINANCE_ROLES, ...PROCUREMENT_ROLES],
      },
    ],
  },

  // ── HR (HR Officer, Executives) ──
  {
    label: 'HR Statistics',
    icon: 'UsersRound',
    allowedRoles: [...EXECUTIVE_ROLES, 'HR_OFFICER'],
    children: [
      { label: 'Overview', href: '/admin/hr/overview', icon: 'BarChart3' },
      { label: 'Manage Staffs', href: '/admin/hr/staff', icon: 'IdCard' },
      {
        label: 'Payroll',
        href: '/admin/hr/payroll',
        icon: 'BadgeDollarSign',
        badge: 'UPDATED',
      },
      {
        label: 'Leave Management',
        href: '/admin/hr/leave',
        icon: 'CalendarDays',
      },
    ],
  },

  // ── Visitors (Front Desk, Security, PM, Admin) ──
  {
    label: 'Visitors Management',
    href: '/admin/visitors',
    icon: 'UserCheck',
    allowedRoles: [...EXECUTIVE_ROLES, ...PM_ROLES, 'CUSTOMER_CARE', 'SITE_SUPERVISOR'],
  },

  // ── Reports & Analytics (All internal roles view domain reports) ──
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: 'FileBarChart',
    // Universal access; report content filtered in feature
  },
  {
    label: 'Notifications',
    href: '/admin/notifications',
    icon: 'Bell',
  },

  // ── Content & Media (Admin & Marketing) ──
  {
    label: 'Content (CMS)',
    icon: 'Globe',
    allowedRoles: [...EXECUTIVE_ROLES, 'MARKETING_OFFICER'],
    children: [
      { label: 'Website CMS', href: '/admin/cms', icon: 'FileText' },
      { label: 'Media Library', href: '/admin/media', icon: 'Image' },
    ],
  },

  // ── System Administration (Super Admin & Admin Only) ──
  {
    label: 'Administration',
    icon: 'Lock',
    allowedRoles: [...EXECUTIVE_ROLES],
    children: [
      {
        label: 'Users',
        href: '/admin/users',
        icon: 'Users',
        badge: 'NEW',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Roles & Perms',
        href: '/admin/roles',
        icon: 'Lock',
        badge: 'NEW',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Audit Logs',
        href: '/admin/audit',
        icon: 'History',
        badge: 'NEW',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'System Activity',
        href: '/admin/activity-logs',
        icon: 'Activity',
        allowedRoles: [...EXECUTIVE_ROLES],
      },
    ],
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: 'Settings',
  },
] as const;

export function isNavGroup(item: AdminNavItem): item is AdminNavGroup {
  return 'children' in item;
}

/**
 * Checks if a given set of user roles has permission for a navigation item.
 * If allowedRoles is not specified, it is accessible to all authenticated admin users.
 * Executive roles (SUPER_ADMIN, ADMIN, DIRECTOR, MANAGING_DIRECTOR) bypass restrictions.
 */
export function hasRoleAccess(
  allowedRoles: readonly string[] | undefined,
  userRoles: readonly string[] = [],
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (userRoles.some((r) => EXECUTIVE_ROLES.includes(r as any))) return true;
  return allowedRoles.some((r) => userRoles.includes(r));
}

/**
 * Filters the admin navigation tree for a specific set of user roles.
 */
export function filterNavForRoles(
  nav: readonly AdminNavItem[],
  userRoles: readonly string[] = [],
): AdminNavItem[] {
  // Super admin / Executive sees everything
  if (userRoles.some((r) => EXECUTIVE_ROLES.includes(r as any))) {
    return [...nav];
  }

  const result: AdminNavItem[] = [];

  for (const item of nav) {
    if (isNavGroup(item)) {
      // Check group-level access first
      if (!hasRoleAccess(item.allowedRoles, userRoles)) continue;

      // Filter children
      const filteredChildren = item.children.filter((child) =>
        hasRoleAccess(child.allowedRoles, userRoles),
      );

      if (filteredChildren.length > 0) {
        result.push({
          ...item,
          children: filteredChildren,
        });
      }
    } else {
      if (hasRoleAccess(item.allowedRoles, userRoles)) {
        result.push(item);
      }
    }
  }

  return result;
}

/**
 * Determines the primary dashboard persona category from user roles.
 */
export function getPrimaryRoleCategory(
  roles: readonly string[] = [],
): 'sales' | 'pm' | 'engineering' | 'executive' {
  if (roles.some((r) => EXECUTIVE_ROLES.includes(r as any))) return 'executive';
  if (roles.some((r) => SALES_ROLES.includes(r as any))) return 'sales';
  if (roles.some((r) => PM_ROLES.includes(r as any))) return 'pm';
  if (roles.some((r) => ENGINEERING_ROLES.includes(r as any))) return 'engineering';
  return 'executive';
}

/**
 * Finds the allowed roles defined for a given path across the navigation structure.
 */
export function getAllowedRolesForPath(
  pathname: string,
): readonly string[] | null {
  for (const item of adminNav) {
    if (isNavGroup(item)) {
      for (const child of item.children) {
        if (child.href === pathname || (pathname.startsWith(child.href) && child.href !== '/admin')) {
          return child.allowedRoles || item.allowedRoles || null;
        }
      }
    } else {
      if (item.href === pathname || (pathname.startsWith(item.href) && item.href !== '/admin')) {
        return item.allowedRoles || null;
      }
    }
  }
  return null;
}
