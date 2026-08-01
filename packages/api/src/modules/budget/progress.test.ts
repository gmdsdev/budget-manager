import {
  BudgetStatus,
  CategoryColor,
  TransactionStatus,
} from "@budget-manager/schemas";
import { describe, expect, test } from "bun:test";

import {
  buildBudgetHistory,
  buildBudgetProgress,
  buildBudgetTotals,
  deriveBudgetStatus,
  type BudgetPeriodRow,
  type CategorySpendMovement,
  type MonthlyCategorySpendMovement,
} from "./progress";

const BRL = "BRL";
const USD = "USD";
const MONTH = "2026-07";
const GROCERIES = "cat-groceries";

function period(over: Partial<BudgetPeriodRow> = {}): BudgetPeriodRow {
  return {
    id: "period-1",
    budgetId: "budget-1",
    categoryId: GROCERIES,
    categoryName: "Groceries",
    categoryColor: CategoryColor.GREEN,
    currencyCode: BRL,
    periodMonth: MONTH,
    amountCents: 100_000,
    isOverride: false,
    ...over,
  };
}

function spend(
  over: Partial<CategorySpendMovement> = {},
): CategorySpendMovement {
  return {
    currencyCode: BRL,
    categoryId: GROCERIES,
    status: TransactionStatus.PAID,
    totalCents: 40_000,
    ...over,
  };
}

describe("deriveBudgetStatus", () => {
  test("is on track well under the limit", () => {
    expect(
      deriveBudgetStatus({ limitCents: 100_000, spentCents: 50_000 }),
    ).toBe(BudgetStatus.ON_TRACK);
  });

  test("warns from four fifths of the limit", () => {
    expect(
      deriveBudgetStatus({ limitCents: 100_000, spentCents: 79_999 }),
    ).toBe(BudgetStatus.ON_TRACK);
    expect(
      deriveBudgetStatus({ limitCents: 100_000, spentCents: 80_000 }),
    ).toBe(BudgetStatus.WARNING);
  });

  test("spending exactly the limit is still not over it", () => {
    expect(
      deriveBudgetStatus({ limitCents: 100_000, spentCents: 100_000 }),
    ).toBe(BudgetStatus.WARNING);
    expect(
      deriveBudgetStatus({ limitCents: 100_000, spentCents: 100_001 }),
    ).toBe(BudgetStatus.EXCEEDED);
  });

  test("spending nothing against no limit is not on track", () => {
    expect(deriveBudgetStatus({ limitCents: 0, spentCents: 0 })).toBe(
      BudgetStatus.EXCEEDED,
    );
  });
});

describe("buildBudgetProgress", () => {
  test("reports an untouched budget as fully remaining", () => {
    const [row] = buildBudgetProgress([period()], []);

    expect(row?.limitCents).toBe(100_000);
    expect(row?.spentCents).toBe(0);
    expect(row?.projectedSpentCents).toBe(0);
    expect(row?.remainingCents).toBe(100_000);
    expect(row?.status).toBe(BudgetStatus.ON_TRACK);
  });

  test("counts settled rows in both figures and scheduled ones only in the projection", () => {
    const [row] = buildBudgetProgress(
      [period()],
      [
        spend({ totalCents: 30_000, status: TransactionStatus.PAID }),
        spend({
          totalCents: 25_000,
          status: TransactionStatus.WAITING_PAYMENT,
        }),
      ],
    );

    expect(row?.spentCents).toBe(30_000);
    expect(row?.projectedSpentCents).toBe(55_000);
    // What is left to spend is measured against what the month is committed to.
    expect(row?.remainingCents).toBe(45_000);
  });

  test("ignores cancelled rows entirely", () => {
    const [row] = buildBudgetProgress(
      [period()],
      [spend({ totalCents: 90_000, status: TransactionStatus.CANCELLED })],
    );

    expect(row?.projectedSpentCents).toBe(0);
    expect(row?.status).toBe(BudgetStatus.ON_TRACK);
  });

  test("ignores spending with no category", () => {
    const [row] = buildBudgetProgress(
      [period()],
      [spend({ categoryId: null, totalCents: 90_000 })],
    );

    expect(row?.projectedSpentCents).toBe(0);
  });

  test("never spends one currency's budget with another currency's rows", () => {
    const [row] = buildBudgetProgress(
      [period()],
      [spend({ currencyCode: USD, totalCents: 90_000 })],
    );

    expect(row?.projectedSpentCents).toBe(0);
    expect(row?.remainingCents).toBe(100_000);
  });

  test("gives the same category one budget per currency", () => {
    const rows = buildBudgetProgress(
      [
        period({ id: "brl", currencyCode: BRL, amountCents: 100_000 }),
        period({ id: "usd", currencyCode: USD, amountCents: 50_000 }),
      ],
      [
        spend({ currencyCode: BRL, totalCents: 90_000 }),
        spend({ currencyCode: USD, totalCents: 10_000 }),
      ],
    );

    expect(rows.find((row) => row.periodId === "brl")?.remainingCents).toBe(
      10_000,
    );
    expect(rows.find((row) => row.periodId === "usd")?.remainingCents).toBe(
      40_000,
    );
  });

  test("overspending goes negative rather than clamping", () => {
    const [row] = buildBudgetProgress(
      [period()],
      [spend({ totalCents: 130_000 })],
    );

    expect(row?.remainingCents).toBe(-30_000);
    expect(row?.status).toBe(BudgetStatus.EXCEEDED);
    expect(row?.usedRatio).toBeCloseTo(1.3);
  });

  test("ranks the worst-off budget first", () => {
    const rows = buildBudgetProgress(
      [
        period({ id: "fine", categoryId: "cat-a", categoryName: "Alpha" }),
        period({ id: "over", categoryId: "cat-b", categoryName: "Beta" }),
      ],
      [
        spend({ categoryId: "cat-a", totalCents: 10_000 }),
        spend({ categoryId: "cat-b", totalCents: 120_000 }),
      ],
    );

    expect(rows.map((row) => row.periodId)).toEqual(["over", "fine"]);
  });

  test("carries the override flag through", () => {
    const [row] = buildBudgetProgress([period({ isOverride: true })], []);

    expect(row?.isOverride).toBe(true);
  });
});

describe("buildBudgetHistory", () => {
  function monthly(
    over: Partial<MonthlyCategorySpendMovement> = {},
  ): MonthlyCategorySpendMovement {
    return { month: MONTH, ...spend(), ...over };
  }

  test("matches each month's spending to its own limit", () => {
    const rows = buildBudgetHistory(
      [
        period({ id: "jul", periodMonth: "2026-07" }),
        period({ id: "aug", periodMonth: "2026-08" }),
      ],
      [
        monthly({ month: "2026-07", totalCents: 90_000 }),
        monthly({ month: "2026-08", totalCents: 10_000 }),
      ],
    );

    expect(rows.map((row) => row.periodId)).toEqual(["jul", "aug"]);
    expect(rows[0]?.projectedSpentCents).toBe(90_000);
    expect(rows[1]?.projectedSpentCents).toBe(10_000);
  });

  test("a month with no spending reads as untouched, not as the next month's", () => {
    const rows = buildBudgetHistory(
      [
        period({ id: "jul", periodMonth: "2026-07" }),
        period({ id: "aug", periodMonth: "2026-08" }),
      ],
      [monthly({ month: "2026-08", totalCents: 70_000 })],
    );

    expect(rows[0]?.projectedSpentCents).toBe(0);
    expect(rows[1]?.projectedSpentCents).toBe(70_000);
  });

  test("returns months oldest first", () => {
    const rows = buildBudgetHistory(
      [
        period({ id: "sep", periodMonth: "2026-09" }),
        period({ id: "jul", periodMonth: "2026-07" }),
      ],
      [],
    );

    expect(rows.map((row) => row.periodMonth)).toEqual(["2026-07", "2026-09"]);
  });
});

describe("buildBudgetTotals", () => {
  test("adds up the budgets in a currency", () => {
    const totals = buildBudgetTotals(
      buildBudgetProgress(
        [
          period({ id: "a", categoryId: "cat-a", amountCents: 100_000 }),
          period({ id: "b", categoryId: "cat-b", amountCents: 50_000 }),
        ],
        [
          spend({ categoryId: "cat-a", totalCents: 20_000 }),
          spend({
            categoryId: "cat-b",
            totalCents: 30_000,
            status: TransactionStatus.WAITING_PAYMENT,
          }),
        ],
      ),
    );

    expect(totals).toHaveLength(1);
    expect(totals[0]?.budgetCount).toBe(2);
    expect(totals[0]?.limitCents).toBe(150_000);
    expect(totals[0]?.spentCents).toBe(20_000);
    expect(totals[0]?.projectedSpentCents).toBe(50_000);
    expect(totals[0]?.remainingCents).toBe(100_000);
    expect(totals[0]?.exceededCount).toBe(0);
  });

  test("never sums across currencies", () => {
    const totals = buildBudgetTotals(
      buildBudgetProgress(
        [
          period({ id: "brl", currencyCode: BRL, amountCents: 100_000 }),
          period({
            id: "usd",
            currencyCode: USD,
            categoryId: "cat-b",
            amountCents: 40_000,
          }),
        ],
        [],
      ),
    );

    expect(totals.map((row) => row.currencyCode)).toEqual([BRL, USD]);
    expect(totals[0]?.limitCents).toBe(100_000);
    expect(totals[1]?.limitCents).toBe(40_000);
  });

  test("counts the budgets that are over", () => {
    const totals = buildBudgetTotals(
      buildBudgetProgress(
        [
          period({ id: "a", categoryId: "cat-a" }),
          period({ id: "b", categoryId: "cat-b" }),
        ],
        [
          spend({ categoryId: "cat-a", totalCents: 120_000 }),
          spend({ categoryId: "cat-b", totalCents: 1_000 }),
        ],
      ),
    );

    expect(totals[0]?.exceededCount).toBe(1);
  });
});
