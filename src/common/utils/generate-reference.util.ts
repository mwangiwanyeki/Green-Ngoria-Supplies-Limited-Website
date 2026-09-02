/**
 * Generate human-readable reference numbers for business entities.
 * These are NOT UUIDs — they are display identifiers used in documents,
 * quotations, invoices, RFQs, etc.
 *
 * Uniqueness is guaranteed by an atomic DB-backed sequence (the
 * `ReferenceSequence` table) rather than random numbers, which can collide.
 * Callers MUST pass the transaction client they intend to persist the
 * generated entity with, so the sequence increment and the entity write
 * commit or roll back together.
 */

import type { Prisma, PrismaClient } from '@prisma/client';

/** Any Prisma client capable of running `referenceSequence` queries — the
 * root PrismaService or a `$transaction` callback's `tx` client. */
export type ReferenceDbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Atomically increments (creating if necessary) the named sequence and
 * returns the new value. Safe under concurrent callers because the
 * increment happens in a single upsert statement.
 */
async function nextSequenceValue(
  db: ReferenceDbClient,
  key: string,
): Promise<number> {
  const seq = await db.referenceSequence.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return seq.value;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

function currentYear(): number {
  return new Date().getFullYear();
}

export async function generateRfqNumber(
  db: ReferenceDbClient,
): Promise<string> {
  const year = currentYear();
  const seq = await nextSequenceValue(db, `rfq-${year}`);
  return `RFQ-${year}-${pad(seq, 5)}`;
}

export async function generateQuoteNumber(
  db: ReferenceDbClient,
): Promise<string> {
  const year = currentYear();
  const seq = await nextSequenceValue(db, `quote-${year}`);
  return `QUO-${year}-${pad(seq, 5)}`;
}

export async function generateProjectNumber(
  db: ReferenceDbClient,
): Promise<string> {
  const year = currentYear();
  const seq = await nextSequenceValue(db, `project-${year}`);
  return `PRJ-${year}-${pad(seq, 4)}`;
}

export async function generateInvoiceNumber(
  db: ReferenceDbClient,
): Promise<string> {
  const year = currentYear();
  const seq = await nextSequenceValue(db, `invoice-${year}`);
  return `INV-${year}-${pad(seq, 5)}`;
}

export async function generateContractNumber(
  db: ReferenceDbClient,
): Promise<string> {
  const year = currentYear();
  const seq = await nextSequenceValue(db, `contract-${year}`);
  return `CON-${year}-${pad(seq, 4)}`;
}

export async function generatePurchaseOrderNumber(
  db: ReferenceDbClient,
): Promise<string> {
  const year = currentYear();
  const seq = await nextSequenceValue(db, `po-${year}`);
  return `PO-${year}-${pad(seq, 5)}`;
}

export async function generateAssessmentNumber(
  db: ReferenceDbClient,
): Promise<string> {
  const year = currentYear();
  const seq = await nextSequenceValue(db, `assessment-${year}`);
  return `TPA-${year}-${pad(seq, 4)}`;
}

export async function generateTicketNumber(
  db: ReferenceDbClient,
): Promise<string> {
  const seq = await nextSequenceValue(db, 'ticket');
  return `TKT-${pad(seq, 6)}`;
}

export async function generateAssetNumber(
  db: ReferenceDbClient,
  category: string,
): Promise<string> {
  const prefix = category.substring(0, 3).toUpperCase();
  const seq = await nextSequenceValue(db, `asset-${prefix}`);
  return `AST-${prefix}-${pad(seq, 5)}`;
}

export async function generateWorkOrderNumber(
  db: ReferenceDbClient,
): Promise<string> {
  const year = currentYear();
  const seq = await nextSequenceValue(db, `workorder-${year}`);
  return `WO-${year}-${pad(seq, 5)}`;
}

export async function generateLeadReference(
  db: ReferenceDbClient,
): Promise<string> {
  const seq = await nextSequenceValue(db, 'lead');
  return `LEAD-${5000 + seq}`;
}

/** Client number — `CLT-<seq>`, offset to keep the historic CLT-1001 style. */
export async function generateClientNumber(
  db: ReferenceDbClient,
): Promise<string> {
  const seq = await nextSequenceValue(db, 'client');
  return `CLT-${1000 + seq}`;
}

// ─── Operations ERP ─────────────────────────────────────────────────────────
// ERP references are branch-scoped: the sequence key embeds the branch id so
// two branches never contend on the same counter and each gets its own run of
// numbers, matching the `@@unique([branchId, sku])` style constraints.

/** Inventory SKU — `GN-<year>-<seq>` as used by the live dashboard. */
export async function generateSku(
  db: ReferenceDbClient,
  branchId: string,
): Promise<string> {
  const year = currentYear();
  const seq = await nextSequenceValue(db, `sku-${branchId}-${year}`);
  return `GN-${year}-${pad(seq, 5)}`;
}

/** POS receipt number — `RCP-<year>-<seq>`. */
export async function generateReceiptNumber(
  db: ReferenceDbClient,
  branchId: string,
): Promise<string> {
  const year = currentYear();
  const seq = await nextSequenceValue(db, `receipt-${branchId}-${year}`);
  return `RCP-${year}-${pad(seq, 6)}`;
}

/** Expense reference — `EXP-<year>-<seq>`. */
export async function generateExpenseReference(
  db: ReferenceDbClient,
  branchId: string,
): Promise<string> {
  const year = currentYear();
  const seq = await nextSequenceValue(db, `expense-${branchId}-${year}`);
  return `EXP-${year}-${pad(seq, 5)}`;
}

/** ERP customer number — `CUS-<seq>`. */
export async function generateCustomerNumber(
  db: ReferenceDbClient,
  branchId: string,
): Promise<string> {
  const seq = await nextSequenceValue(db, `erp-customer-${branchId}`);
  return `CUS-${pad(seq, 5)}`;
}

/** Vat leach rental reference — `VLR-<year>-<seq>`. */
export async function generateVatLeachRentalReference(
  db: ReferenceDbClient,
  branchId: string,
): Promise<string> {
  const year = currentYear();
  const seq = await nextSequenceValue(
    db,
    `vat-leach-rental-${branchId}-${year}`,
  );
  return `VLR-${year}-${pad(seq, 5)}`;
}

/** Vat leach unit code — `VAT-<seq>`. */
export async function generateVatLeachUnitCode(
  db: ReferenceDbClient,
  branchId: string,
): Promise<string> {
  const seq = await nextSequenceValue(db, `vat-leach-unit-${branchId}`);
  return `VAT-${pad(seq, 4)}`;
}

/** Stock pile code — `SP-<year>-<seq>`. */
export async function generateStockPileCode(
  db: ReferenceDbClient,
  branchId: string,
): Promise<string> {
  const year = currentYear();
  const seq = await nextSequenceValue(db, `stock-pile-${branchId}-${year}`);
  return `SP-${year}-${pad(seq, 4)}`;
}

/** Security log reference — `SEC-<year>-<seq>`. */
export async function generateSecurityLogReference(
  db: ReferenceDbClient,
  branchId: string,
): Promise<string> {
  const year = currentYear();
  const seq = await nextSequenceValue(db, `security-log-${branchId}-${year}`);
  return `SEC-${year}-${pad(seq, 5)}`;
}

/** Staff number — `STF-<seq>`. */
export async function generateStaffNumber(
  db: ReferenceDbClient,
  branchId: string,
): Promise<string> {
  const seq = await nextSequenceValue(db, `staff-${branchId}`);
  return `STF-${pad(seq, 5)}`;
}

/** Payroll run reference — `PAY-<year><month>-<seq>`. */
export async function generatePayrollRunReference(
  db: ReferenceDbClient,
  branchId: string,
  periodYear: number,
  periodMonth: number,
): Promise<string> {
  const seq = await nextSequenceValue(db, `payroll-${branchId}-${periodYear}`);
  return `PAY-${periodYear}${pad(periodMonth, 2)}-${pad(seq, 4)}`;
}

/** Visitor badge number — `VIS-<year>-<seq>`. */
export async function generateVisitorBadgeNumber(
  db: ReferenceDbClient,
  branchId: string,
): Promise<string> {
  const year = currentYear();
  const seq = await nextSequenceValue(db, `visitor-${branchId}-${year}`);
  return `VIS-${year}-${pad(seq, 5)}`;
}

/** Branch code — `BR-<seq>`, scoped to the organization. */
export async function generateBranchCode(
  db: ReferenceDbClient,
  organizationId: string,
): Promise<string> {
  const seq = await nextSequenceValue(db, `branch-${organizationId}`);
  return `BR-${pad(seq, 3)}`;
}

/** Prisma error code for a unique constraint violation. */
export const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === UNIQUE_CONSTRAINT_VIOLATION
  );
}

/**
 * Defense-in-depth retry wrapper around an entity-creation operation that
 * generates its own reference number internally (typically inside its own
 * `$transaction`). If the operation fails on a unique constraint violation
 * (e.g. a race on the reference column), it is retried up to `maxRetries`
 * additional times — each retry naturally draws a fresh reference number
 * since the sequence has already advanced.
 */
export async function retryOnUniqueConstraint<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
      // Loop again — the next attempt draws a fresh reference number.
    }
  }
  throw lastError;
}
