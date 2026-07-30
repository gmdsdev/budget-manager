import { TransactionKind, TransactionStatus } from "@budget-manager/schemas";
import { describe, expect, test } from "bun:test";

import {
  buildCurrencySummaries,
  monthRange,
  resolveMonth,
  trailingMonths,
  UNCATEGORIZED_LABEL,
  type CardBalanceRow,
  type CategoryMovement,
  type TrendMovement,
  type WalletBalanceRow,
} from "./summary";

const BRL = "BRL";
const USD = "USD";

const MONTH = "2026-07";
const PREVIOUS_MONTH = "2026-06";
const WINDOW = trailingMonths(MONTH, 6);

let sequence = 0;

function wallet(over: Partial<WalletBalanceRow> = {}): WalletBalanceRow {
  sequence += 1;

  return {
    id: `wallet-${sequence}`,
    name: `Wallet ${sequence}`,
    currencyCode: BRL,
    balanceCents: 500_000,
    projectedBalanceCents: 500_000,
    ...over,
  };
}

function card(over: Partial<CardBalanceRow> = {}): CardBalanceRow {
  sequence += 1;

  return {
    id: `card-${sequence}`,
    name: `Card ${sequence}`,
    currencyCode: BRL,
    limitCents: 500_000,
    outstandingCents: 0,
    availableCents: 500_000,
    ...over,
  };
}

function movement(over: Partial<TrendMovement> = {}): TrendMovement {
  return {
    month: MONTH,
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

function summarize(
  over: Partial<Parameters<typeof buildCurrencySummaries>[0]> = {},
) {
  return buildCurrencySummaries({
    wallets: [],
    trendMonths: WINDOW,
    trendMovements: [],
    categoryMovements: [],
    ...over,
  });
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

describe("trailingMonths", () => {
  test("ends on the month asked for, oldest first", () => {
    expect(trailingMonths("2026-07", 6)).toEqual([
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
    ]);
  });

  test("rolls back across the year boundary", () => {
    expect(trailingMonths("2026-02", 4)).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  test("a window of one is just that month", () => {
    expect(trailingMonths("2026-07", 1)).toEqual(["2026-07"]);
  });

  test("rejects a malformed month", () => {
    expect(() => trailingMonths("2026-7", 6)).toThrow();
  });
});

describe("buildCurrencySummaries — cards", () => {
  test("reports no card debt when the user has none", () => {
    const [brl] = summarize({ wallets: [wallet()] });

    expect(brl?.cardCount).toBe(0);
    expect(brl?.cardOutstandingCents).toBe(0);
    expect(brl?.netWorthCents).toBe(500_000);
  });

  test("subtracts card debt from the liquid balance", () => {
    const [brl] = summarize({
      wallets: [wallet()],
      cards: [card({ outstandingCents: 120_000, availableCents: 380_000 })],
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
        card({ outstandingCents: 100_000, availableCents: 1_000 }),
        card({ outstandingCents: 50_000, availableCents: 2_000 }),
      ],
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
        card({
          currencyCode: USD,
          outstandingCents: 90_000,
          availableCents: 10_000,
        }),
      ],
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
      cards: [card({ outstandingCents: 70_000, availableCents: 0 })],
    });

    expect(brl?.walletCount).toBe(0);
    expect(brl?.netWorthCents).toBe(-70_000);
  });

  test("an overspent card can push the position negative", () => {
    const [brl] = summarize({
      wallets: [wallet({ balanceCents: 10_000 })],
      cards: [card({ outstandingCents: 60_000, availableCents: -10_000 })],
    });

    expect(brl?.netWorthCents).toBe(-50_000);
  });
});

describe("buildCurrencySummaries — accounts behind the totals", () => {
  test("lists each wallet under its own currency", () => {
    const summaries = summarize({
      wallets: [
        wallet({ id: "w-1", name: "Checking", balanceCents: 300_000 }),
        wallet({ id: "w-2", name: "Savings", balanceCents: 200_000 }),
        wallet({ id: "w-3", name: "Dollars", currencyCode: USD }),
      ],
    });

    const brl = summaries.find((s) => s.currencyCode === BRL);
    const usd = summaries.find((s) => s.currencyCode === USD);

    expect(brl?.wallets.map((w) => w.name)).toEqual(["Checking", "Savings"]);
    expect(brl?.wallets[0]?.balanceCents).toBe(300_000);
    expect(usd?.wallets.map((w) => w.name)).toEqual(["Dollars"]);
  });

  test("carries each card's limit so utilisation can be shown", () => {
    const [brl] = summarize({
      cards: [
        card({
          id: "c-1",
          name: "Visa",
          limitCents: 500_000,
          outstandingCents: 120_000,
          availableCents: 380_000,
        }),
      ],
    });

    expect(brl?.cards).toEqual([
      {
        id: "c-1",
        name: "Visa",
        limitCents: 500_000,
        outstandingCents: 120_000,
        availableCents: 380_000,
      },
    ]);
  });
});

describe("buildCurrencySummaries — trend", () => {
  test("returns one point per month in the window, oldest first", () => {
    const [brl] = summarize({ wallets: [wallet()] });

    expect(brl?.trend.map((point) => point.month)).toEqual(WINDOW);
    expect(brl?.trend.every((point) => point.netCents === 0)).toBe(true);
  });

  test("buckets movements into the month they fall in", () => {
    const [brl] = summarize({
      trendMovements: [
        movement({
          month: PREVIOUS_MONTH,
          kind: TransactionKind.INCOME,
          totalCents: 400_000,
        }),
        movement({ month: PREVIOUS_MONTH, totalCents: 100_000 }),
        movement({
          month: MONTH,
          kind: TransactionKind.INCOME,
          totalCents: 500_000,
        }),
      ],
    });

    const previous = brl?.trend.find((p) => p.month === PREVIOUS_MONTH);
    const current = brl?.trend.find((p) => p.month === MONTH);

    expect(previous).toEqual({
      month: PREVIOUS_MONTH,
      incomeCents: 400_000,
      expenseCents: 100_000,
      netCents: 300_000,
    });
    expect(current?.incomeCents).toBe(500_000);
    expect(current?.expenseCents).toBe(0);
  });

  test("the month in view is the last point, so the two cannot disagree", () => {
    const [brl] = summarize({
      trendMovements: [
        movement({ kind: TransactionKind.INCOME, totalCents: 500_000 }),
        movement({ totalCents: 120_000 }),
        // Outside the window entirely: it must not leak into the figures.
        movement({ month: "2025-01", totalCents: 999_999 }),
      ],
    });

    const last = brl?.trend.at(-1);

    expect(last?.month).toBe(MONTH);
    expect(brl?.incomeCents).toBe(last?.incomeCents);
    expect(brl?.expenseCents).toBe(last?.expenseCents);
    expect(brl?.netCents).toBe(last?.netCents);
    expect(brl?.expenseCents).toBe(120_000);
  });

  test("keeps a currency's history separate", () => {
    const summaries = summarize({
      trendMovements: [
        movement({ currencyCode: BRL, totalCents: 10_000 }),
        movement({ currencyCode: USD, totalCents: 7_000 }),
      ],
    });

    expect(
      summaries.map((s) => [s.currencyCode, s.trend.at(-1)?.expenseCents]),
    ).toEqual([
      [BRL, 10_000],
      [USD, 7_000],
    ]);
  });

  test("excludes transfers and card payments from every point", () => {
    const [brl] = summarize({
      trendMovements: [
        movement({
          month: PREVIOUS_MONTH,
          kind: TransactionKind.TRANSFER_IN,
          totalCents: 999,
        }),
        movement({
          month: PREVIOUS_MONTH,
          kind: TransactionKind.CREDIT_CARD_PAYMENT,
          totalCents: 999,
        }),
        movement({ month: PREVIOUS_MONTH, totalCents: 5_000 }),
      ],
    });

    expect(brl?.trend.find((p) => p.month === PREVIOUS_MONTH)).toEqual({
      month: PREVIOUS_MONTH,
      incomeCents: 0,
      expenseCents: 5_000,
      netCents: -5_000,
    });
  });
});

describe("buildCurrencySummaries", () => {
  test("returns nothing when the user has no wallets", () => {
    expect(summarize()).toEqual([]);
  });

  test("adds up balances per currency and counts wallets", () => {
    const [brl, usd] = summarize({
      wallets: [
        wallet({ balanceCents: 100, projectedBalanceCents: 90 }),
        wallet({ balanceCents: 200, projectedBalanceCents: 200 }),
        wallet({
          currencyCode: USD,
          balanceCents: 50,
          projectedBalanceCents: 50,
        }),
      ],
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
        wallet({ balanceCents: 1_000, projectedBalanceCents: 1_000 }),
        wallet({
          currencyCode: USD,
          balanceCents: 1_000,
          projectedBalanceCents: 1_000,
        }),
      ],
      trendMovements: [
        movement({ currencyCode: BRL, kind: TransactionKind.INCOME }),
        movement({ currencyCode: USD, kind: TransactionKind.INCOME }),
      ],
    });

    expect(summaries.length).toBe(2);
    expect(summaries.every((s) => s.balanceCents === 1_000)).toBe(true);
    expect(summaries.every((s) => s.incomeCents === 10_000)).toBe(true);
  });

  test("nets income against expense for the month", () => {
    const [brl] = summarize({
      trendMovements: [
        movement({ kind: TransactionKind.INCOME, totalCents: 500_000 }),
        movement({ kind: TransactionKind.EXPENSE, totalCents: 120_000 }),
      ],
    });

    expect(brl?.incomeCents).toBe(500_000);
    expect(brl?.expenseCents).toBe(120_000);
    expect(brl?.netCents).toBe(380_000);
  });

  test("excludes transfers, which only move money between own wallets", () => {
    const [brl] = summarize({
      wallets: [
        wallet({ balanceCents: 5_000, projectedBalanceCents: 5_000 }),
      ],
      trendMovements: [
        movement({ kind: TransactionKind.TRANSFER_IN, totalCents: 999 }),
        movement({ kind: TransactionKind.TRANSFER_OUT, totalCents: 999 }),
      ],
    });

    expect(brl?.incomeCents).toBe(0);
    expect(brl?.expenseCents).toBe(0);
    expect(brl?.netCents).toBe(0);
    // The transfer still shows up in the wallet balance, just not the month.
    expect(brl?.balanceCents).toBe(5_000);
  });

  test("excludes cancelled rows but keeps pending ones", () => {
    const [brl] = summarize({
      trendMovements: [
        movement({ totalCents: 7_000, status: TransactionStatus.CANCELLED }),
        movement({
          totalCents: 3_000,
          status: TransactionStatus.WAITING_PAYMENT,
        }),
      ],
    });

    expect(brl?.expenseCents).toBe(3_000);
  });

  test("counts a card purchase as spending", () => {
    const [brl] = summarize({
      wallets: [wallet({ balanceCents: 0, projectedBalanceCents: 0 })],
      trendMovements: [
        movement({
          kind: TransactionKind.CREDIT_CARD_PURCHASE,
          totalCents: 45_000,
        }),
      ],
    });

    expect(brl?.expenseCents).toBe(45_000);
  });

  test("does not count paying a card bill, which would double the expense", () => {
    const [brl] = summarize({
      wallets: [wallet({ balanceCents: 0, projectedBalanceCents: 0 })],
      trendMovements: [
        movement({
          kind: TransactionKind.CREDIT_CARD_PURCHASE,
          totalCents: 45_000,
        }),
        movement({
          kind: TransactionKind.CREDIT_CARD_PAYMENT,
          totalCents: 45_000,
        }),
      ],
    });

    // The purchase is the expense; settling it later is not a second one.
    expect(brl?.expenseCents).toBe(45_000);
  });

  test("ignores a kind outside the model entirely", () => {
    const [brl] = summarize({
      wallets: [wallet({ balanceCents: 0, projectedBalanceCents: 0 })],
      trendMovements: [movement({ kind: "some_future_kind" })],
    });

    expect(brl?.expenseCents).toBe(0);
  });

  test("shows nothing at all when there are no wallets and no countable rows", () => {
    expect(
      summarize({
        trendMovements: [movement({ kind: TransactionKind.TRANSFER_IN })],
      }),
    ).toEqual([]);
  });

  test("ranks categories by spend and merges duplicate rows", () => {
    const [brl] = summarize({
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
      trendMovements: [movement({ kind: TransactionKind.INCOME })],
    });

    expect(brl?.currencyCode).toBe(BRL);
    expect(brl?.walletCount).toBe(0);
  });

  test("orders currencies deterministically", () => {
    const summaries = summarize({
      wallets: [
        wallet({ currencyCode: USD, balanceCents: 1 }),
        wallet({ currencyCode: "EUR", balanceCents: 1 }),
        wallet({ currencyCode: BRL, balanceCents: 1 }),
      ],
    });

    expect(summaries.map((s) => s.currencyCode)).toEqual(["BRL", "EUR", "USD"]);
  });
});
