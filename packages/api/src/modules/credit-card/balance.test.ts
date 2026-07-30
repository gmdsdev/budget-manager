import { TransactionKind, TransactionStatus } from "@budget-manager/schemas";
import { describe, expect, test } from "bun:test";

import { computeCardBalances, type CardMovementTotal } from "./balance";

const CARD = { id: "card-a", limitCents: 500_000 };
const OTHER = { id: "card-b", limitCents: 100_000 };

function movement(over: Partial<CardMovementTotal> = {}): CardMovementTotal {
  return {
    creditCardId: CARD.id,
    kind: TransactionKind.CREDIT_CARD_PURCHASE,
    status: TransactionStatus.PAID,
    totalCents: 30_000,
    ...over,
  };
}

function balancesOf(movements: CardMovementTotal[]) {
  const [card] = computeCardBalances([CARD], movements);

  return card;
}

describe("computeCardBalances", () => {
  test("a fresh card owes nothing and has its full limit", () => {
    const card = balancesOf([]);

    expect(card?.outstandingCents).toBe(0);
    expect(card?.projectedOutstandingCents).toBe(0);
    expect(card?.availableCents).toBe(500_000);
  });

  test("a purchase increases what is owed and reduces what is available", () => {
    const card = balancesOf([movement({ totalCents: 120_000 })]);

    expect(card?.outstandingCents).toBe(120_000);
    expect(card?.availableCents).toBe(380_000);
  });

  test("a payment reduces what is owed and frees the limit again", () => {
    const card = balancesOf([
      movement({ totalCents: 120_000 }),
      movement({
        kind: TransactionKind.CREDIT_CARD_PAYMENT,
        totalCents: 50_000,
      }),
    ]);

    expect(card?.outstandingCents).toBe(70_000);
    expect(card?.availableCents).toBe(430_000);
  });

  test("paying the balance in full clears the card", () => {
    const card = balancesOf([
      movement({ totalCents: 80_000 }),
      movement({
        kind: TransactionKind.CREDIT_CARD_PAYMENT,
        totalCents: 80_000,
      }),
    ]);

    expect(card?.outstandingCents).toBe(0);
    expect(card?.availableCents).toBe(500_000);
  });

  test("pending rows move only the projection", () => {
    const card = balancesOf([
      movement({ totalCents: 40_000, status: TransactionStatus.PAID }),
      movement({
        totalCents: 25_000,
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    ]);

    expect(card?.outstandingCents).toBe(40_000);
    expect(card?.projectedOutstandingCents).toBe(65_000);
    // Available tracks the settled figure, not the projection.
    expect(card?.availableCents).toBe(460_000);
  });

  test("cancelled rows count for nothing", () => {
    const card = balancesOf([
      movement({ totalCents: 90_000, status: TransactionStatus.CANCELLED }),
    ]);

    expect(card?.outstandingCents).toBe(0);
    expect(card?.availableCents).toBe(500_000);
  });

  test("overspending reports a negative available balance rather than clamping", () => {
    const card = balancesOf([movement({ totalCents: 600_000 })]);

    expect(card?.outstandingCents).toBe(600_000);
    expect(card?.availableCents).toBe(-100_000);
  });

  test("wallet kinds never move a card balance", () => {
    const card = balancesOf([
      movement({ kind: TransactionKind.EXPENSE, totalCents: 10_000 }),
      movement({ kind: TransactionKind.INCOME, totalCents: 10_000 }),
      movement({ kind: TransactionKind.TRANSFER_OUT, totalCents: 10_000 }),
    ]);

    expect(card?.outstandingCents).toBe(0);
  });

  test("ignores rows with no card", () => {
    expect(balancesOf([movement({ creditCardId: null })])?.outstandingCents).toBe(
      0,
    );
  });

  test("attributes movements to the right card", () => {
    const [a, b] = computeCardBalances(
      [CARD, OTHER],
      [movement({ creditCardId: OTHER.id, totalCents: 25_000 })],
    );

    expect(a?.outstandingCents).toBe(0);
    expect(b?.outstandingCents).toBe(25_000);
    expect(b?.availableCents).toBe(75_000);
  });

  test("keeps the other card fields intact", () => {
    const [only] = computeCardBalances([{ ...CARD, name: "Visa" }], []);

    expect(only?.name).toBe("Visa");
  });
});
