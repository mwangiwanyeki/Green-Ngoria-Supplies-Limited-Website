'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { company } from '@/config/company';
import { formatKsh } from '@/components/admin/erp-list-shell';
import type { SaleDetail, PaymentMethod } from '@/lib/api/hooks/use-sales';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  MOBILE_MONEY: 'M-Pesa / Mobile',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  OTHER: 'Other',
};

/**
 * Global print CSS: when the browser print dialog runs, hide everything on the
 * page except the receipt root, then let the receipt fill the page. Injected
 * once (multiple mounts render identical rules, which is harmless) so the same
 * receipt renders print-clean from the POS preview and the Sales detail view.
 */
const PRINT_STYLES = `
.gn-receipt-print.gn-print-only { display: none; }
@media print {
  body * { visibility: hidden !important; }
  .gn-receipt-print.gn-print-only { display: block !important; }
  .gn-receipt-print, .gn-receipt-print * { visibility: visible !important; }
  .gn-receipt-print {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: 80mm !important;
    margin: 0 auto !important;
    padding: 4mm !important;
    color: #000 !important;
    background: #fff !important;
    box-shadow: none !important;
  }
  .gn-receipt-print table { color: #000 !important; }
  @page { margin: 6mm; }
}
`;

export interface SaleReceiptProps {
  sale: SaleDetail;
  /**
   * Amount physically tendered at the till (POS only). When it exceeds the sale
   * total, the difference is shown as change — the persisted sale record caps
   * amountPaid at the total, so change is only known at the point of sale.
   */
  tendered?: number;
  className?: string;
  /**
   * When true the receipt is hidden on screen and only rendered by the browser
   * print dialog. Use this to attach a printable receipt to a page whose visible
   * UI is a richer detail view (e.g. the Sales detail dialog).
   */
  printOnly?: boolean;
}

/**
 * A print-clean sales receipt for Green Ngoria Supplies Limited. Renders the
 * company header, receipt meta, line items, financial summary, payments and a
 * thank-you footer. Reused by the POS post-sale preview and the Sales detail
 * dialog so there is a single source of truth for receipt layout.
 */
export function SaleReceipt({
  sale,
  tendered,
  className,
  printOnly,
}: SaleReceiptProps) {
  const total = Number(sale.totalAmount);
  const amountPaid = Number(sale.amountPaid);
  const amountDue = Number(sale.amountDue);
  const change =
    tendered !== undefined && tendered > total ? tendered - total : 0;
  const soldAt = sale.soldAt ? new Date(sale.soldAt) : new Date();

  const phones = company.contact.phones.slice(0, 2).map((p) => p.value);

  return (
    <div
      className={`gn-receipt-print mx-auto w-full max-w-sm bg-white text-black ${printOnly ? 'gn-print-only ' : ''}${className ?? ''}`}
    >
      <style>{PRINT_STYLES}</style>

      {/* Company header */}
      <div className="border-b border-dashed border-black/40 pb-3 text-center">
        <h2 className="text-base font-bold uppercase tracking-wide">
          {company.legalName}
        </h2>
        <p className="mt-1 text-[11px] leading-tight text-black/70">
          {company.contact.addressOneLine}
        </p>
        <p className="text-[11px] leading-tight text-black/70">
          Tel: {phones.join(' / ')}
        </p>
        <p className="text-[11px] leading-tight text-black/70">
          {company.contact.emails[0]?.value} · {company.contact.website}
        </p>
        <p className="mt-1 text-[10px] text-black/60">
          PIN: {company.registration.kraPin}
        </p>
      </div>

      {/* Receipt meta */}
      <div className="space-y-0.5 border-b border-dashed border-black/40 py-3 text-[11px]">
        <div className="flex justify-between">
          <span className="text-black/60">Receipt</span>
          <span className="font-mono font-semibold">{sale.receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-black/60">Date</span>
          <span>{format(soldAt, 'dd MMM yyyy · HH:mm')}</span>
        </div>
        {sale.cashier && (
          <div className="flex justify-between">
            <span className="text-black/60">Cashier</span>
            <span>
              {sale.cashier.firstName} {sale.cashier.lastName}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-black/60">Customer</span>
          <span>{sale.customer?.name ?? 'Walk-in'}</span>
        </div>
        {sale.customer?.phone && (
          <div className="flex justify-between">
            <span className="text-black/60">Phone</span>
            <span>{sale.customer.phone}</span>
          </div>
        )}
      </div>

      {/* Line items */}
      <table className="w-full border-b border-dashed border-black/40 py-2 text-[11px]">
        <thead>
          <tr className="border-b border-black/20 text-left">
            <th className="py-1 font-semibold">Item</th>
            <th className="py-1 text-right font-semibold">Qty</th>
            <th className="py-1 text-right font-semibold">Price</th>
            <th className="py-1 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.lineItems.map((line) => (
            <tr key={line.id} className="align-top">
              <td className="py-1 pr-1">
                <span className="font-medium">{line.name}</span>
                {line.sku && (
                  <span className="block font-mono text-[9px] text-black/50">
                    {line.sku}
                  </span>
                )}
              </td>
              <td className="py-1 text-right tabular-nums">{line.quantity}</td>
              <td className="py-1 text-right tabular-nums">
                {formatKsh(line.unitPrice)}
              </td>
              <td className="py-1 text-right font-medium tabular-nums">
                {formatKsh(line.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Financial summary */}
      <div className="space-y-1 border-b border-dashed border-black/40 py-3 text-[11px]">
        <ReceiptRow label="Subtotal" value={formatKsh(sale.subtotal)} />
        {Number(sale.discountAmount) > 0 && (
          <ReceiptRow
            label="Discount"
            value={`-${formatKsh(sale.discountAmount)}`}
          />
        )}
        {Number(sale.taxRate) > 0 && (
          <ReceiptRow
            label={`Tax (${Number(sale.taxRate).toFixed(1)}%)`}
            value={formatKsh(sale.taxAmount)}
          />
        )}
        <div className="flex justify-between border-t border-black/20 pt-1.5 text-sm font-bold">
          <span>TOTAL</span>
          <span className="tabular-nums">{formatKsh(sale.totalAmount)}</span>
        </div>
      </div>

      {/* Payments */}
      <div className="space-y-1 border-b border-dashed border-black/40 py-3 text-[11px]">
        {sale.payments.length > 0 ? (
          sale.payments.map((p) => (
            <ReceiptRow
              key={p.id}
              label={PAYMENT_METHOD_LABELS[p.method] ?? p.method}
              value={formatKsh(p.amount)}
            />
          ))
        ) : (
          <ReceiptRow label="Paid" value={formatKsh(amountPaid)} />
        )}
        {change > 0 && (
          <>
            <ReceiptRow label="Tendered" value={formatKsh(tendered ?? 0)} />
            <div className="flex justify-between font-semibold">
              <span>Change</span>
              <span className="tabular-nums">{formatKsh(change)}</span>
            </div>
          </>
        )}
        {amountDue > 0 && (
          <div className="flex justify-between font-bold">
            <span>Balance Due</span>
            <span className="tabular-nums">{formatKsh(amountDue)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 text-center text-[10px] text-black/70">
        <p className="font-semibold">Thank you for your business!</p>
        <p className="mt-0.5">Goods sold are subject to our returns policy.</p>
        <p className="mt-1 text-black/50">{company.tagline}</p>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-black/60">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
