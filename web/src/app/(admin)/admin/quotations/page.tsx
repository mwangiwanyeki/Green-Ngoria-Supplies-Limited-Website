import type { Metadata } from 'next';
import { AdminQuotationsList } from '@/features/admin/admin-quotations-list';
import { AdminSectionGuard } from '@/components/admin/admin-section-guard';

export const metadata: Metadata = { title: 'Quotations | Admin' };

export default function AdminQuotationsPage() {
  return (
    <AdminSectionGuard>
      <AdminQuotationsList />
    </AdminSectionGuard>
  );
}
