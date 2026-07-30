import { TransactionKind, TransactionStatus } from "@budget-manager/schemas";
import { describe, expect, test } from "bun:test";

import { computeBillTotals, type BillMovementTotal } from "./bill-totals";

const TODAY = "2026-07-15";
const BILL = { id: "bill-a", closeAt: "2026-07-10" };
const OPEN_BILL = { id: "bill-b", closeAt: "2026-08-10" };

function movement(over: Partial<BillMovementTotal> = {}): BillMovementTotal {
  return {
    creditCardBillId: BILL.id,
    kind: TransactionKind.CREDIT_CARD_PURCHASE,
    status: TransactionStatus.PAID,
    totalCents: 50_000,
    ...over,
  };
}

function totalsOf(movements: BillMovementTotal[], bill = BILL) {
  const [result] = computeBillTotals([bill], movements, TODAY);

  return result;
}

describe("computeBillTotals", () => {
  test("an untouched closed bill is awaiting payment with nothing on it", () => {
    const bill = totalsOf([]);

    expect(bill?.statementTotalCents).toBe(0);
    expect(bill?.paidCents).toBe(0);
    expect(bill?.remainingCents).toBe(0);
    expect(bill?.status).toBe("awaiting_payment");
  });

  test("a bill whose cycle has not closed is still open", () => {
    expect(totalsOf([], OPEN_BILL)?.status).toBe("open");
  });

  test("sums purchases into the statement total", () => {
    const bill = totalsOf([
      movement({ totalCents: 30_000 }),
      movement({ totalCents: 20_000 }),
    ]);

    expect(bill?.statementTotalCents).toBe(50_000);
    expect(bill?.remainingCents).toBe(50_000);
  });

  test("a partial payment leaves a remainder and does not settle it", () => {
    const bill = totalsOf([
      movement({ totalCents: 50_000 }),
      movement({
        kind: TransactionKind.CREDIT_CARD_PAYMENT,
        totalCents: 20_000,
      }),
    ]);

    expect(bill?.paidCents).toBe(20_000);
    expect(bill?.remainingCents).toBe(30_000);
    expect(bill?.status).toBe("awaiting_payment");
  });

  test("paying in full settles it and leaves nothing owed", () => {
    const bill = totalsOf([
      movement({ totalCents: 50_000 }),
      movement({
        kind: TransactionKind.CREDIT_CARD_PAYMENT,
        totalCents: 50_000,
      }),
    ]);

    expect(bill?.remainingCents).toBe(0);
    expect(bill?.status).toBe("paid");
  });

  test("an overpayment never reports a negative remainder", () => {
    const bill = totalsOf([
      movement({ totalCents: 50_000 }),
      movement({
        kind: TransactionKind.CREDIT_CARD_PAYMENT,
        totalCents: 60_000,
      }),
    ]);

    expect(bill?.remainingCents).toBe(0);
    expect(bill?.status).toBe("paid");
  });

  test("cancelled rows count for nothing on either side", () => {
    const bill = totalsOf([
      movement({ totalCents: 50_000, status: TransactionStatus.CANCELLED }),
      movement({
        kind: TransactionKind.CREDIT_CARD_PAYMENT,
        totalCents: 10_000,
        status: TransactionStatus.CANCELLED,
      }),
    ]);

    expect(bill?.statementTotalCents).toBe(0);
    expect(bill?.paidCents).toBe(0);
  });

  test("pending purchases still count toward the statement", () => {
    // A statement lists what was bought, whether or not it has cleared.
    const bill = totalsOf([
      movement({
        totalCents: 25_000,
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    ]);

    expect(bill?.statementTotalCents).toBe(25_000);
  });

  test("wallet kinds never touch a statement", () => {
    const bill = totalsOf([
      movement({ kind: TransactionKind.EXPENSE, totalCents: 90_000 }),
      movement({ kind: TransactionKind.TRANSFER_OUT, totalCents: 90_000 }),
    ]);

    expect(bill?.statementTotalCents).toBe(0);
    expect(bill?.paidCents).toBe(0);
  });

  test("ignores rows linked to no bill", () => {
    expect(
      totalsOf([movement({ creditCardBillId: null })])?.statementTotalCents,
    ).toBe(0);
  });

  test("attributes movements to the right bill", () => {
    const [first, second] = computeBillTotals(
      [BILL, OPEN_BILL],
      [
        movement({ totalCents: 10_000 }),
        movement({ creditCardBillId: OPEN_BILL.id, totalCents: 70_000 }),
      ],
      TODAY,
    );

    expect(first?.statementTotalCents).toBe(10_000);
    expect(second?.statementTotalCents).toBe(70_000);
  });

  test("keeps the other bill fields intact", () => {
    const [only] = computeBillTotals(
      [{ ...BILL, dueAt: "2026-07-20" }],
      [],
      TODAY,
    );

    expect(only?.dueAt).toBe("2026-07-20");
  });
});
