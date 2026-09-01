import type { Metadata } from 'next';
import { AdminQuotationsList } from '@/features/admin/admin-quotations-list';

export const metadata: Metadata = { title: 'Quotations | Admin' };

export default function AdminQuotationsPage() {
  return <AdminQuotationsList />;
}
