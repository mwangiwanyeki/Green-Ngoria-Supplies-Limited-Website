import type { Metadata } from 'next';
import { PortalProjectsList } from '@/features/portal/portal-projects-list';

export const metadata: Metadata = { title: 'My Projects' };
export default function PortalProjectsPage() {
  return <PortalProjectsList />;
}
