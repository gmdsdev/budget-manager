import {
  BUDGET_WARNING_RATIO,
  BudgetStatus,
  type CategoryColor,
  TransactionStatus,
  isTransactionStatus,
} from "@budget-manager/schemas";

/** A materialized month of a budget, joined to the category it limits. */
export type BudgetPeriodRow = {
  id: string;
  budgetId: string | null;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  currencyCode: string;
  periodMonth: string;
  amountCents: number;
  isOverride: boolean;
};

/**
 * Spending in the month, already grouped by the owning account's currency. The
 * kinds that count are decided in SQL by `MONTH_EXPENSE_KINDS` — the same
 * allowlist the dashboard's month expenses use, so a budget can never disagree
 * with the figure above it.
 */
export type CategorySpendMovement = {
  currencyCode: string;
  categoryId: string | null;
  status: string;
  totalCents: number;
};

export type BudgetProgress = {
  periodId: string;
  budgetId: string | null;
  categoryId: string;
  categoryName: string;
  categoryColor: CategoryColor;
  currencyCode: string;
  periodMonth: string;
  limitCents: number;
  /** Settled rows only. */
  spentCents: number;
  /** Settled plus still-scheduled rows: what the month is committed to. */
  projectedSpentCents: number;
  /** Limit minus committed spending. Negative means over budget. */
  remainingCents: number;
  /** Committed spending as a share of the limit; 1 is exactly on the line. */
  usedRatio: number;
  status: BudgetStatus;
  isOverride: boolean;
};

export type BudgetTotals = {
  currencyCode: string;
  budgetCount: number;
  limitCents: number;
  spentCents: number;
  projectedSpentCents: number;
  remainingCents: number;
  exceededCount: number;
};

/**
 * Derived rather than stored, like a statement's status: it is a reading of two
 * numbers that both move whenever a transaction does, so anything stored would
 * be stale before it was read.
 */
export function deriveBudgetStatus({
  limitCents,
  spentCents,
}: {
  limitCents: number;
  spentCents: number;
}): BudgetStatus {
  if (limitCents <= 0 || spentCents > limitCents) {
    return BudgetStatus.EXCEEDED;
  }

  return spentCents >= limitCents * BUDGET_WARNING_RATIO
    ? BudgetStatus.WARNING
    : BudgetStatus.ON_TRACK;
}

function spendKey(categoryId: string, currencyCode: string) {
  return `${currencyCode}:${categoryId}`;
}

/**
 * Pairs each budgeted month with what was actually spent against it.
 *
 * Spending is matched on **both** the category and the currency: two wallets in
 * two currencies charging the same category are two different budgets, and
 * there are no FX rates here to reconcile them with.
 */
export function buildBudgetProgress(
  periods: BudgetPeriodRow[],
  movements: CategorySpendMovement[],
): BudgetProgress[] {
  const settled = new Map<string, number>();
  const projected = new Map<string, number>();

  for (const movement of movements) {
    if (
      !movement.categoryId ||
      !isTransactionStatus(movement.status) ||
      movement.status === TransactionStatus.CANCELLED
    ) {
      continue;
    }

    const key = spendKey(movement.categoryId, movement.currencyCode);

    projected.set(key, (projected.get(key) ?? 0) + movement.totalCents);

    if (movement.status === TransactionStatus.PAID) {
      settled.set(key, (settled.get(key) ?? 0) + movement.totalCents);
    }
  }

  return periods
    .map((period): BudgetProgress => {
      const key = spendKey(period.categoryId, period.currencyCode);
      const spentCents = settled.get(key) ?? 0;
      const projectedSpentCents = projected.get(key) ?? 0;

      return {
        periodId: period.id,
        budgetId: period.budgetId,
        categoryId: period.categoryId,
        categoryName: period.categoryName,
        categoryColor: period.categoryColor as CategoryColor,
        currencyCode: period.currencyCode,
        periodMonth: period.periodMonth,
        limitCents: period.amountCents,
        spentCents,
        projectedSpentCents,
        remainingCents: period.amountCents - projectedSpentCents,
        usedRatio:
          period.amountCents > 0 ? projectedSpentCents / period.amountCents : 0,
        status: deriveBudgetStatus({
          limitCents: period.amountCents,
          spentCents: projectedSpentCents,
        }),
        isOverride: period.isOverride,
      };
    })
    .sort(
      (a, b) =>
        b.usedRatio - a.usedRatio ||
        a.categoryName.localeCompare(b.categoryName),
    );
}

export type MonthlyCategorySpendMovement = CategorySpendMovement & {
  month: string;
};

/**
 * The same reading, applied a month at a time — one budget's own history.
 * Spending is matched to the month it happened in, so a series' list of months
 * shows what each period actually cost rather than one figure repeated.
 */
export function buildBudgetHistory(
  periods: BudgetPeriodRow[],
  movements: MonthlyCategorySpendMovement[],
): BudgetProgress[] {
  const byMonth = new Map<string, CategorySpendMovement[]>();

  for (const movement of movements) {
    const bucket = byMonth.get(movement.month) ?? [];

    bucket.push(movement);
    byMonth.set(movement.month, bucket);
  }

  return periods
    .flatMap((period) =>
      buildBudgetProgress([period], byMonth.get(period.periodMonth) ?? []),
    )
    .sort((a, b) => a.periodMonth.localeCompare(b.periodMonth));
}

/**
 * One row per currency. Totals are never added across currencies — a single
 * "budgeted" figure spanning BRL and USD would be fiction.
 */
export function buildBudgetTotals(progress: BudgetProgress[]): BudgetTotals[] {
  const byCurrency = new Map<string, BudgetTotals>();

  for (const entry of progress) {
    const totals = byCurrency.get(entry.currencyCode) ?? {
      currencyCode: entry.currencyCode,
      budgetCount: 0,
      limitCents: 0,
      spentCents: 0,
      projectedSpentCents: 0,
      remainingCents: 0,
      exceededCount: 0,
    };

    totals.budgetCount += 1;
    totals.limitCents += entry.limitCents;
    totals.spentCents += entry.spentCents;
    totals.projectedSpentCents += entry.projectedSpentCents;
    totals.remainingCents += entry.remainingCents;

    if (entry.status === BudgetStatus.EXCEEDED) {
      totals.exceededCount += 1;
    }

    byCurrency.set(entry.currencyCode, totals);
  }

  return [...byCurrency.values()].sort((a, b) =>
    a.currencyCode.localeCompare(b.currencyCode),
  );
}
