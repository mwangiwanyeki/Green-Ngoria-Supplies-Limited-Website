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
] as const;

// ─── Admin (ERP) navigation ────────────────────────────────────────────────
// Structure derived directly from the live company dashboard recording,
// documented in .agents/ERP_SPEC.md. Order and labels must be preserved.

export type AdminBadge = 'NEW' | 'UPDATED';

export interface AdminNavLeaf {
  label: string;
  href: string;
  icon?: string;
  badge?: AdminBadge;
}

export interface AdminNavGroup {
  label: string;
  icon?: string;
  children: AdminNavLeaf[];
}

export type AdminNavItem = AdminNavLeaf | AdminNavGroup;

export const adminNav: readonly AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
  {
    label: 'Sales',
    icon: 'ShoppingBag',
    children: [
      { label: 'Inventory', href: '/admin/inventory', icon: 'Boxes' },
      {
        label: 'POS',
        href: '/admin/pos',
        icon: 'Calculator',
        badge: 'UPDATED',
      },
      {
        label: 'Today Sales',
        href: '/admin/today-sales',
        icon: 'CalendarClock',
      },
    ],
  },
  { label: 'All Sales', href: '/admin/all-sales', icon: 'Receipt' },
  {
    label: 'Store Management',
    href: '/admin/store-management',
    icon: 'Warehouse',
  },
  {
    label: 'Debt Management',
    icon: 'HandCoins',
    children: [
      { label: 'Customers', href: '/admin/customers', icon: 'Users' },
      { label: 'Manage Debt', href: '/admin/manage-debt', icon: 'Coins' },
    ],
  },
  { label: 'Expenses', href: '/admin/expenses', icon: 'Wallet' },
  { label: 'Accounts', href: '/admin/accounts', icon: 'Landmark' },
  {
    label: 'Orders',
    icon: 'PackageCheck',
    children: [
      { label: 'Suppliers', href: '/admin/suppliers', icon: 'Truck' },
    ],
  },
  {
    label: 'Operations Control',
    icon: 'Cog',
    children: [
      {
        label: 'Vat Leach',
        href: '/admin/vat-leach',
        icon: 'FlaskConical',
        badge: 'UPDATED',
      },
      {
        label: 'Stock Pile',
        href: '/admin/stock-piles',
        icon: 'Mountain',
        badge: 'NEW',
      },
      {
        label: 'Security',
        href: '/admin/security',
        icon: 'ShieldAlert',
        badge: 'NEW',
      },
    ],
  },
  {
    label: 'HR Statistics',
    icon: 'UsersRound',
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
  {
    label: 'Visitors Management',
    href: '/admin/visitors',
    icon: 'UserCheck',
  },
  { label: 'Reports', href: '/admin/reports', icon: 'FileBarChart' },
  {
    label: 'Company Portal',
    href: '/admin/company-portal',
    icon: 'Building2',
  },
  { label: 'Admin Panel', href: '/admin/admin-panel', icon: 'Lock' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
  { label: 'Activity Logs', href: '/admin/activity-logs', icon: 'History' },
] as const;

export function isNavGroup(item: AdminNavItem): item is AdminNavGroup {
  return 'children' in item;
}
