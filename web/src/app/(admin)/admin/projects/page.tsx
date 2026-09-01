import type { Metadata } from 'next';
import { AdminProjectsList } from '@/features/admin/admin-projects-list';
import { AdminSectionGuard } from '@/components/admin/admin-section-guard';

export const metadata: Metadata = { title: 'Projects | Admin' };

export default function AdminProjectsPage() {
  return (
    <AdminSectionGuard>
      <AdminProjectsList />
    </AdminSectionGuard>
  );
}
