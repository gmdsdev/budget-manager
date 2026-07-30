import { TransactionKind, TransactionStatus } from "@budget-manager/schemas";
import { describe, expect, test } from "bun:test";

import {
  buildCurrencySummaries,
  monthRange,
  resolveMonth,
  UNCATEGORIZED_LABEL,
  type CategoryMovement,
  type CurrencyMovement,
} from "./summary";

const BRL = "BRL";
const USD = "USD";

function movement(over: Partial<CurrencyMovement> = {}): CurrencyMovement {
  return {
    currencyCode: BRL,
    kind: TransactionKind.EXPENSE,
    status: TransactionStatus.PAID,
    totalCents: 10_000,
    ...over,
  };
}

function categoryMovement(
  over: Partial<CategoryMovement> = {},
): CategoryMovement {
  return {
    currencyCode: BRL,
    categoryId: "cat-1",
    categoryName: "Groceries",
    status: TransactionStatus.PAID,
    totalCents: 10_000,
    ...over,
  };
}

function summarize(over: Parameters<typeof buildCurrencySummaries>[0]) {
  return buildCurrencySummaries(over);
}

describe("monthRange", () => {
  test("covers a 31-day month", () => {
    expect(monthRange("2026-07")).toEqual({
      from: "2026-07-01",
      to: "2026-07-31",
    });
  });

  test("covers a 30-day month", () => {
    expect(monthRange("2026-04")).toEqual({
      from: "2026-04-01",
      to: "2026-04-30",
    });
  });

  test("handles February in a common year and a leap year", () => {
    expect(monthRange("2026-02").to).toBe("2026-02-28");
    expect(monthRange("2028-02").to).toBe("2028-02-29");
  });

  test("handles December without rolling the year", () => {
    expect(monthRange("2026-12")).toEqual({
      from: "2026-12-01",
      to: "2026-12-31",
    });
  });

  test("rejects malformed or out-of-range months", () => {
    expect(() => monthRange("2026-13")).toThrow();
    expect(() => monthRange("07-2026")).toThrow();
    expect(() => monthRange("2026-7")).toThrow();
  });
});

describe("resolveMonth", () => {
  test("zero-pads single-digit months", () => {
    expect(resolveMonth(new Date(2026, 0, 9))).toBe("2026-01");
  });
});

describe("buildCurrencySummaries — cards", () => {
  const wallet = (over = {}) => ({
    currencyCode: BRL,
    balanceCents: 500_000,
    projectedBalanceCents: 500_000,
    ...over,
  });

  test("reports no card debt when the user has none", () => {
    const [brl] = summarize({
      wallets: [wallet()],
      monthMovements: [],
      categoryMovements: [],
    });

    expect(brl?.cardCount).toBe(0);
    expect(brl?.cardOutstandingCents).toBe(0);
    expect(brl?.netWorthCents).toBe(500_000);
  });

  test("subtracts card debt from the liquid balance", () => {
    const [brl] = summarize({
      wallets: [wallet()],
      cards: [
        {
          currencyCode: BRL,
          outstandingCents: 120_000,
          availableCents: 380_000,
        },
      ],
      monthMovements: [],
      categoryMovements: [],
    });

    expect(brl?.cardCount).toBe(1);
    expect(brl?.cardOutstandingCents).toBe(120_000);
    expect(brl?.cardAvailableCents).toBe(380_000);
    // 5.000 in the bank, 1.200 owed: the position is 3.800, not 5.000.
    expect(brl?.netWorthCents).toBe(380_000);
  });

  test("adds up several cards in the same currency", () => {
    const [brl] = summarize({
      wallets: [wallet()],
      cards: [
        { currencyCode: BRL, outstandingCents: 100_000, availableCents: 1_000 },
        { currencyCode: BRL, outstandingCents: 50_000, availableCents: 2_000 },
      ],
      monthMovements: [],
      categoryMovements: [],
    });

    expect(brl?.cardCount).toBe(2);
    expect(brl?.cardOutstandingCents).toBe(150_000);
    expect(brl?.cardAvailableCents).toBe(3_000);
    expect(brl?.netWorthCents).toBe(350_000);
  });

  test("never nets a card against a wallet in another currency", () => {
    const summaries = summarize({
      wallets: [wallet({ currencyCode: BRL, balanceCents: 500_000 })],
      cards: [
        { currencyCode: USD, outstandingCents: 90_000, availableCents: 10_000 },
      ],
      monthMovements: [],
      categoryMovements: [],
    });

    const brl = summaries.find((s) => s.currencyCode === BRL);
    const usd = summaries.find((s) => s.currencyCode === USD);

    expect(brl?.netWorthCents).toBe(500_000);
    expect(brl?.cardOutstandingCents).toBe(0);
    // A card-only currency still gets a row, with no wallets behind it.
    expect(usd?.walletCount).toBe(0);
    expect(usd?.cardOutstandingCents).toBe(90_000);
    expect(usd?.netWorthCents).toBe(-90_000);
  });

  test("a card-only currency surfaces its debt as a negative position", () => {
    const [brl] = summarize({
      wallets: [],
      cards: [
        { currencyCode: BRL, outstandingCents: 70_000, availableCents: 0 },
      ],
      monthMovements: [],
      categoryMovements: [],
    });

    expect(brl?.walletCount).toBe(0);
    expect(brl?.netWorthCents).toBe(-70_000);
  });

  test("an overspent card can push the position negative", () => {
    const [brl] = summarize({
      wallets: [wallet({ balanceCents: 10_000 })],
      cards: [
        {
          currencyCode: BRL,
          outstandingCents: 60_000,
          availableCents: -10_000,
        },
      ],
      monthMovements: [],
      categoryMovements: [],
    });

    expect(brl?.netWorthCents).toBe(-50_000);
  });
});

describe("buildCurrencySummaries", () => {
  test("returns nothing when the user has no wallets", () => {
    expect(
      summarize({ wallets: [], monthMovements: [], categoryMovements: [] }),
    ).toEqual([]);
  });

  test("adds up balances per currency and counts wallets", () => {
    const [brl, usd] = summarize({
      wallets: [
        { currencyCode: BRL, balanceCents: 100, projectedBalanceCents: 90 },
        { currencyCode: BRL, balanceCents: 200, projectedBalanceCents: 200 },
        { currencyCode: USD, balanceCents: 50, projectedBalanceCents: 50 },
      ],
      monthMovements: [],
      categoryMovements: [],
    });

    expect(brl?.currencyCode).toBe(BRL);
    expect(brl?.walletCount).toBe(2);
    expect(brl?.balanceCents).toBe(300);
    expect(brl?.projectedBalanceCents).toBe(290);
    expect(usd?.walletCount).toBe(1);
    expect(usd?.balanceCents).toBe(50);
  });

  test("never mixes two currencies into one total", () => {
    const summaries = summarize({
      wallets: [
        {
          currencyCode: BRL,
          balanceCents: 1_000,
          projectedBalanceCents: 1_000,
        },
        {
          currencyCode: USD,
          balanceCents: 1_000,
          projectedBalanceCents: 1_000,
        },
      ],
      monthMovements: [
        movement({ currencyCode: BRL, kind: TransactionKind.INCOME }),
        movement({ currencyCode: USD, kind: TransactionKind.INCOME }),
      ],
      categoryMovements: [],
    });

    expect(summaries.length).toBe(2);
    expect(summaries.every((s) => s.balanceCents === 1_000)).toBe(true);
    expect(summaries.every((s) => s.incomeCents === 10_000)).toBe(true);
  });

  test("nets income against expense for the month", () => {
    const [brl] = summarize({
      wallets: [],
      monthMovements: [
        movement({ kind: TransactionKind.INCOME, totalCents: 500_000 }),
        movement({ kind: TransactionKind.EXPENSE, totalCents: 120_000 }),
      ],
      categoryMovements: [],
    });

    expect(brl?.incomeCents).toBe(500_000);
    expect(brl?.expenseCents).toBe(120_000);
    expect(brl?.netCents).toBe(380_000);
  });

  test("excludes transfers, which only move money between own wallets", () => {
    const [brl] = summarize({
      wallets: [
        {
          currencyCode: BRL,
          balanceCents: 5_000,
          projectedBalanceCents: 5_000,
        },
      ],
      monthMovements: [
        movement({ kind: TransactionKind.TRANSFER_IN, totalCents: 999 }),
        movement({ kind: TransactionKind.TRANSFER_OUT, totalCents: 999 }),
      ],
      categoryMovements: [],
    });

    expect(brl?.incomeCents).toBe(0);
    expect(brl?.expenseCents).toBe(0);
    expect(brl?.netCents).toBe(0);
    // The transfer still shows up in the wallet balance, just not the month.
    expect(brl?.balanceCents).toBe(5_000);
  });

  test("excludes cancelled rows but keeps pending ones", () => {
    const [brl] = summarize({
      wallets: [],
      monthMovements: [
        movement({ totalCents: 7_000, status: TransactionStatus.CANCELLED }),
        movement({
          totalCents: 3_000,
          status: TransactionStatus.WAITING_PAYMENT,
        }),
      ],
      categoryMovements: [],
    });

    expect(brl?.expenseCents).toBe(3_000);
  });

  test("counts a card purchase as spending", () => {
    const [brl] = summarize({
      wallets: [
        { currencyCode: BRL, balanceCents: 0, projectedBalanceCents: 0 },
      ],
      monthMovements: [
        movement({
          kind: TransactionKind.CREDIT_CARD_PURCHASE,
          totalCents: 45_000,
        }),
      ],
      categoryMovements: [],
    });

    expect(brl?.expenseCents).toBe(45_000);
  });

  test("does not count paying a card bill, which would double the expense", () => {
    const [brl] = summarize({
      wallets: [
        { currencyCode: BRL, balanceCents: 0, projectedBalanceCents: 0 },
      ],
      monthMovements: [
        movement({
          kind: TransactionKind.CREDIT_CARD_PURCHASE,
          totalCents: 45_000,
        }),
        movement({
          kind: TransactionKind.CREDIT_CARD_PAYMENT,
          totalCents: 45_000,
        }),
      ],
      categoryMovements: [],
    });

    // The purchase is the expense; settling it later is not a second one.
    expect(brl?.expenseCents).toBe(45_000);
  });

  test("ignores a kind outside the model entirely", () => {
    const [brl] = summarize({
      wallets: [
        { currencyCode: BRL, balanceCents: 0, projectedBalanceCents: 0 },
      ],
      monthMovements: [movement({ kind: "some_future_kind" })],
      categoryMovements: [],
    });

    expect(brl?.expenseCents).toBe(0);
  });

  test("shows nothing at all when there are no wallets and no countable rows", () => {
    expect(
      summarize({
        wallets: [],
        monthMovements: [movement({ kind: TransactionKind.TRANSFER_IN })],
        categoryMovements: [],
      }),
    ).toEqual([]);
  });

  test("ranks categories by spend and merges duplicate rows", () => {
    const [brl] = summarize({
      wallets: [],
      monthMovements: [],
      categoryMovements: [
        categoryMovement({
          categoryId: "a",
          categoryName: "Rent",
          totalCents: 200_000,
        }),
        categoryMovement({
          categoryId: "b",
          categoryName: "Food",
          totalCents: 30_000,
        }),
        categoryMovement({
          categoryId: "b",
          categoryName: "Food",
          totalCents: 20_000,
          status: TransactionStatus.WAITING_PAYMENT,
        }),
      ],
    });

    expect(brl?.topCategories).toEqual([
      { categoryId: "a", name: "Rent", amountCents: 200_000 },
      { categoryId: "b", name: "Food", amountCents: 50_000 },
    ]);
  });

  test("labels a null category and keeps it rankable", () => {
    const [brl] = summarize({
      wallets: [],
      monthMovements: [],
      categoryMovements: [
        categoryMovement({
          categoryId: null,
          categoryName: null,
          totalCents: 80_000,
        }),
      ],
    });

    expect(brl?.topCategories[0]).toEqual({
      categoryId: null,
      name: UNCATEGORIZED_LABEL,
      amountCents: 80_000,
    });
  });

  test("honours the top-N limit", () => {
    const [brl] = summarize({
      wallets: [],
      monthMovements: [],
      categoryMovements: Array.from({ length: 8 }, (_, i) =>
        categoryMovement({
          categoryId: `c${i}`,
          categoryName: `Cat ${i}`,
          totalCents: (i + 1) * 1_000,
        }),
      ),
      topCategoryLimit: 3,
    });

    expect(brl?.topCategories.length).toBe(3);
    expect(brl?.topCategories.map((c) => c.amountCents)).toEqual([
      8_000, 7_000, 6_000,
    ]);
  });

  test("surfaces a currency that only has movements, no wallets left", () => {
    const [brl] = summarize({
      wallets: [],
      monthMovements: [movement({ kind: TransactionKind.INCOME })],
      categoryMovements: [],
    });

    expect(brl?.currencyCode).toBe(BRL);
    expect(brl?.walletCount).toBe(0);
  });

  test("orders currencies deterministically", () => {
    const summaries = summarize({
      wallets: [
        { currencyCode: USD, balanceCents: 1, projectedBalanceCents: 1 },
        { currencyCode: "EUR", balanceCents: 1, projectedBalanceCents: 1 },
        { currencyCode: BRL, balanceCents: 1, projectedBalanceCents: 1 },
      ],
      monthMovements: [],
      categoryMovements: [],
    });

    expect(summaries.map((s) => s.currencyCode)).toEqual(["BRL", "EUR", "USD"]);
  });
});
