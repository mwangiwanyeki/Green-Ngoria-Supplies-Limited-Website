import { PortalSidebar } from '@/components/portal/portal-sidebar';
import { PortalHeader } from '@/components/portal/portal-header';
import { AuthBoundary } from '@/components/auth-boundary';

const PORTAL_ROLES = ['CLIENT_ADMIN', 'CLIENT_USER'] as const;

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthBoundary allowedRoles={PORTAL_ROLES}>
      <div className="flex h-screen overflow-hidden bg-background">
        <PortalSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <PortalHeader />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AuthBoundary>
  );
}
