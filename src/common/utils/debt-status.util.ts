import { DebtAccountStatus, Prisma } from '@prisma/client';

/**
 * Derives a debt account's status from its balance and due date.
 *
 * Always call this with the outstanding value RETURNED BY an atomic
 * `increment`/`decrement` update — never with a value read before the write —
 * so the status matches the balance that was actually committed.
 *
 * WRITTEN_OFF and SUSPENDED are deliberate manual decisions and are never
 * overwritten by this derivation.
 */
export function resolveDebtStatus(
  outstanding: Prisma.Decimal,
  dueDate: Date | null,
  currentStatus: DebtAccountStatus,
  now: Date = new Date(),
): DebtAccountStatus {
  if (
    currentStatus === DebtAccountStatus.WRITTEN_OFF ||
    currentStatus === DebtAccountStatus.SUSPENDED
  ) {
    return currentStatus;
  }
  if (outstanding.lessThanOrEqualTo(0)) return DebtAccountStatus.SETTLED;
  if (dueDate && dueDate.getTime() < now.getTime()) {
    return DebtAccountStatus.OVERDUE;
  }
  return DebtAccountStatus.CURRENT;
}
