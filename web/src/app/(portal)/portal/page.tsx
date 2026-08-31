import type { Metadata } from 'next';
import { PortalDashboard } from '@/features/portal/portal-dashboard';

export const metadata: Metadata = { title: 'Client Dashboard' };

export default function PortalPage() {
  return <PortalDashboard />;
}
