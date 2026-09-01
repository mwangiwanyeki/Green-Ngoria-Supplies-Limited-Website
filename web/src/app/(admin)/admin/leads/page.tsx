import type { Metadata } from 'next';
import { AdminLeadsList } from '@/features/admin/admin-leads-list';
import { AdminSectionGuard } from '@/components/admin/admin-section-guard';

export const metadata: Metadata = { title: 'Leads & Opportunities | Admin' };

export default function AdminLeadsPage() {
  return (
    <AdminSectionGuard>
      <AdminLeadsList />
    </AdminSectionGuard>
  );
}
