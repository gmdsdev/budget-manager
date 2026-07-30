import {
  TransactionKind,
  TransactionStatus,
  isTransactionKind,
  isTransactionStatus,
} from "@budget-manager/schemas";
import { deriveBillStatus, type BillStatus } from "./cycle";

export type BillMovementTotal = {
  creditCardBillId: string | null;
  kind: string;
  status: string;
  totalCents: number;
};

export type BillTotals = {
  /** Purchases on the statement. */
  statementTotalCents: number;
  /** Payments allocated to it. */
  paidCents: number;
  /** What is still owed; clamped at zero so an overpayment is not negative. */
  remainingCents: number;
  status: BillStatus;
};

/**
 * Sums each bill from its linked occurrences. Cancelled rows count for nothing,
 * and only card kinds are considered, so a mis-linked row cannot move a
 * statement.
 */
export function computeBillTotals<
  B extends { id: string; closeAt: string },
>(bills: B[], movements: BillMovementTotal[], today: string): (B & BillTotals)[] {
  const purchases = new Map<string, number>();
  const payments = new Map<string, number>();

  for (const movement of movements) {
    if (
      !movement.creditCardBillId ||
      !isTransactionKind(movement.kind) ||
      !isTransactionStatus(movement.status) ||
      movement.status === TransactionStatus.CANCELLED
    ) {
      continue;
    }

    if (movement.kind === TransactionKind.CREDIT_CARD_PURCHASE) {
      purchases.set(
        movement.creditCardBillId,
        (purchases.get(movement.creditCardBillId) ?? 0) + movement.totalCents,
      );
    } else if (movement.kind === TransactionKind.CREDIT_CARD_PAYMENT) {
      payments.set(
        movement.creditCardBillId,
        (payments.get(movement.creditCardBillId) ?? 0) + movement.totalCents,
      );
    }
  }

  return bills.map((bill) => {
    const statementTotalCents = purchases.get(bill.id) ?? 0;
    const paidCents = payments.get(bill.id) ?? 0;

    return {
      ...bill,
      statementTotalCents,
      paidCents,
      remainingCents: Math.max(0, statementTotalCents - paidCents),
      status: deriveBillStatus({
        closeAt: bill.closeAt,
        statementTotalCents,
        paidCents,
        today,
      }),
    };
  });
}
