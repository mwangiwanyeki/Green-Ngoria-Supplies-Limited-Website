'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post } from '../api-client';
import { QK } from '../query-keys';
import { useAuthStore } from '@/stores/auth-store';

// ─── Enums (mirror Prisma / backend) ─────────────────────────────────────────

export const INVOICE_STATUSES = [
  'DRAFT',
  'ISSUED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
  'DISPUTED',
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_METHODS = [
  'BANK_TRANSFER',
  'CHEQUE',
  'MOBILE_MONEY',
  'CASH',
  'LETTER_OF_CREDIT',
  'OTHER',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CURRENCIES = ['USD', 'KES', 'TZS', 'UGX', 'RWF', 'EUR', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  MOBILE_MONEY: 'Mobile Money',
  CASH: 'Cash',
  LETTER_OF_CREDIT: 'Letter of Credit',
  OTHER: 'Other',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  ISSUED: 'Issued',
  PARTIALLY_PAID: 'Partial',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
};

// ─── Core types ───────────────────────────────────────────────────────────────

export interface InvoiceClient {
  id: string;
  companyName: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  lineTotal: string | number;
  notes: string | null;
}

export interface InvoicePayment {
  id: string;
  amount: string | number;
  currency: Currency;
  method: PaymentMethod;
  transactionRef: string | null;
  bankName: string | null;
  paymentDate: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

/** Shape returned by findAll (includes client, no line items/payments). */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: Currency;
  subtotal: string | number;
  taxRate: string | number;
  taxAmount: string | number;
  totalAmount: string | number;
  amountPaid: string | number;
  amountDue: string | number;
  dueDate: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client: InvoiceClient | null;
}

/** Shape returned by findById (adds lineItems + payments). */
export interface InvoiceDetail extends Invoice {
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
}

/** Summary from GET /finance/summary. */
export interface FinanceSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueCount: number;
  draftCount: number;
}

// ─── Mutation payloads ────────────────────────────────────────────────────────

export interface InvoiceLineItemPayload {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoicePayload {
  clientId?: string;
  contractId?: string;
  projectId?: string;
  currency: Currency;
  taxRate: number;
  dueDate?: string;
  lineItems: InvoiceLineItemPayload[];
  notes?: string;
}

export interface RecordPaymentPayload {
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  transactionRef?: string;
  bankName?: string;
  paymentDate: string;
  notes?: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function useOrgId() {
  return useAuthStore((s) => s.user?.organizationId) ?? '';
}

// ─── Finance summary ──────────────────────────────────────────────────────────

export function useFinanceSummary() {
  const orgId = useOrgId();
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<FinanceSummary>({
    queryKey: QK.finance.summary(orgId),
    queryFn: () =>
      get<FinanceSummary>(`/organizations/${orgId}/finance/summary`).then(
        (r) => r.data,
      ),
    enabled: !!accessToken && !!orgId,
    staleTime: 2 * 60_000,
  });
}

// ─── Invoices list ────────────────────────────────────────────────────────────

export function useInvoices(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus | '';
}) {
  const orgId = useOrgId();
  const accessToken = useAuthStore((s) => s.accessToken);
  // Strip empty status so it doesn't reach the backend as ?status=
  const cleaned: Record<string, unknown> = { ...params };
  if (!cleaned.status) delete cleaned.status;

  return useQuery({
    queryKey: QK.invoices.all(orgId, cleaned),
    queryFn: () =>
      get(`/organizations/${orgId}/finance/invoices`, { params: cleaned }),
    enabled: !!accessToken && !!orgId,
  });
}

// ─── Single invoice ───────────────────────────────────────────────────────────

export function useInvoice(id: string | null) {
  const orgId = useOrgId();
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<InvoiceDetail>({
    queryKey: QK.invoices.detail(orgId, id ?? ''),
    queryFn: () =>
      get<InvoiceDetail>(
        `/organizations/${orgId}/finance/invoices/${id}`,
      ).then((r) => r.data),
    enabled: !!accessToken && !!orgId && !!id,
    staleTime: 30_000,
  });
}

// ─── Create invoice ───────────────────────────────────────────────────────────

export function useCreateInvoice() {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoicePayload) =>
      post<Invoice>(`/organizations/${orgId}/finance/invoices`, data).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.invoices.all(orgId) });
      void qc.invalidateQueries({ queryKey: QK.finance.summary(orgId) });
    },
  });
}

// ─── Issue invoice ────────────────────────────────────────────────────────────

export function useIssueInvoice() {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      post<Invoice>(
        `/organizations/${orgId}/finance/invoices/${id}/issue`,
      ).then((r) => r.data),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: QK.invoices.all(orgId) });
      void qc.invalidateQueries({ queryKey: QK.invoices.detail(orgId, id) });
      void qc.invalidateQueries({ queryKey: QK.finance.summary(orgId) });
    },
  });
}

// ─── Record payment ───────────────────────────────────────────────────────────

export function useRecordPayment() {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: string;
      data: RecordPaymentPayload;
    }) =>
      post<InvoicePayment>(
        `/organizations/${orgId}/finance/invoices/${invoiceId}/payments`,
        data,
      ).then((r) => r.data),
    onSuccess: (_, { invoiceId }) => {
      void qc.invalidateQueries({ queryKey: QK.invoices.all(orgId) });
      void qc.invalidateQueries({
        queryKey: QK.invoices.detail(orgId, invoiceId),
      });
      void qc.invalidateQueries({ queryKey: QK.finance.summary(orgId) });
    },
  });
}
