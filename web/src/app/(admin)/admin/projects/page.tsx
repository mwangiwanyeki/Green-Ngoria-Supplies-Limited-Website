import type { Metadata } from 'next';
import { AdminProjectsList } from '@/features/admin/admin-projects-list';

export const metadata: Metadata = { title: 'Projects | Admin' };

export default function AdminProjectsPage() {
  return <AdminProjectsList />;
}
