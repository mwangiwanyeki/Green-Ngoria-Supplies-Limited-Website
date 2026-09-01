import type { Metadata } from 'next';
import { AdminLeadsList } from '@/features/admin/admin-leads-list';

export const metadata: Metadata = { title: 'Leads & Opportunities | Admin' };

export default function AdminLeadsPage() {
  return <AdminLeadsList />;
}
