import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';
import { AuthBoundary } from '@/components/auth-boundary';

const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'DIRECTOR',
  'MANAGING_DIRECTOR',
  'LEGAL_OFFICER',
  'PRODUCTION_MANAGER',
  'PROJECT_MANAGER',
  'MINING_ENGINEER',
  'PROCESS_ENGINEER',
  'MECHANICAL_ENGINEER',
  'ELECTRICAL_ENGINEER',
  'PROCUREMENT_OFFICER',
  'FINANCE_OFFICER',
  'HSE_OFFICER',
  'SITE_SUPERVISOR',
  'SALES_MANAGER',
  'CRM_OFFICER',
  'CUSTOMER_CARE',
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthBoundary allowedRoles={ADMIN_ROLES} loginPath="/auth/admin">
      <div className="flex h-screen overflow-hidden bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AuthBoundary>
  );
}
