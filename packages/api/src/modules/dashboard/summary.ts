import { formatDate } from "../../dates";
import {
  MONTH_EXPENSE_KINDS,
  MONTH_INCOME_KINDS,
  TransactionStatus,
  isTransactionKind,
  isTransactionStatus,
} from "@budget-manager/schemas";

export type CurrencyMovement = {
  currencyCode: string;
  kind: string;
  status: string;
  totalCents: number;
};

export type CategoryMovement = {
  currencyCode: string;
  categoryId: string | null;
  categoryName: string | null;
  status: string;
  totalCents: number;
};

export type WalletBalanceRow = {
  currencyCode: string;
  balanceCents: number;
  projectedBalanceCents: number;
};

export type CardBalanceRow = {
  currencyCode: string;
  outstandingCents: number;
  availableCents: number;
};

export type CategorySpend = {
  categoryId: string | null;
  name: string;
  amountCents: number;
};

export type CurrencySummary = {
  currencyCode: string;
  walletCount: number;
  balanceCents: number;
  projectedBalanceCents: number;
  cardCount: number;
  /** What the cards in this currency currently owe. */
  cardOutstandingCents: number;
  /** Credit still spendable across those cards. */
  cardAvailableCents: number;
  /** Liquid money minus card debt: the honest position for this currency. */
  netWorthCents: number;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  topCategories: CategorySpend[];
};

export const UNCATEGORIZED_LABEL = "Uncategorized";

/** Rows a budget month should count: everything the user has not cancelled. */
function counts(status: string) {
  return isTransactionStatus(status) && status !== TransactionStatus.CANCELLED;
}

export function resolveMonth(today: Date): string {
  const month = `${today.getMonth() + 1}`.padStart(2, "0");

  return `${today.getFullYear()}-${month}`;
}

// formatDate now lives in src/dates.ts, shared with the credit-card cycles.
export { formatDate };

/**
 * Inclusive first/last day of a `YYYY-MM` month. Day 0 of the *next* month is
 * the last day of this one, which keeps leap years and 30/31-day months right.
 */
export function monthRange(month: string): { from: string; to: string } {
  const match = /^(\d{4})-(\d{2})$/.exec(month);

  if (!match?.[1] || !match[2]) {
    throw new Error(`Expected a YYYY-MM month, received "${month}"`);
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;

  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error(`Month out of range in "${month}"`);
  }

  return {
    from: formatDate(new Date(year, monthIndex, 1)),
    to: formatDate(new Date(year, monthIndex + 1, 0)),
  };
}

function sumMonthByCurrency(movements: CurrencyMovement[]) {
  const totals = new Map<
    string,
    { incomeCents: number; expenseCents: number }
  >();

  for (const movement of movements) {
    if (!isTransactionKind(movement.kind) || !counts(movement.status)) {
      continue;
    }

    const isIncome = MONTH_INCOME_KINDS.includes(movement.kind);
    const isExpense = MONTH_EXPENSE_KINDS.includes(movement.kind);

    // Transfers move money between the user's own wallets, and a card payment
    // settles a debt the purchase already counted — both would inflate a month
    // that gained and lost nothing.
    if (!isIncome && !isExpense) {
      continue;
    }

    const entry = totals.get(movement.currencyCode) ?? {
      incomeCents: 0,
      expenseCents: 0,
    };

    if (isIncome) {
      entry.incomeCents += movement.totalCents;
    } else {
      entry.expenseCents += movement.totalCents;
    }

    totals.set(movement.currencyCode, entry);
  }

  return totals;
}

function topCategoriesByCurrency(movements: CategoryMovement[], limit: number) {
  const perCurrency = new Map<string, Map<string, CategorySpend>>();

  for (const movement of movements) {
    if (!counts(movement.status)) {
      continue;
    }

    const bucket =
      perCurrency.get(movement.currencyCode) ??
      new Map<string, CategorySpend>();
    const key = movement.categoryId ?? "__uncategorized__";
    const existing = bucket.get(key);

    if (existing) {
      existing.amountCents += movement.totalCents;
    } else {
      bucket.set(key, {
        categoryId: movement.categoryId,
        name: movement.categoryName ?? UNCATEGORIZED_LABEL,
        amountCents: movement.totalCents,
      });
    }

    perCurrency.set(movement.currencyCode, bucket);
  }

  const result = new Map<string, CategorySpend[]>();

  for (const [currencyCode, bucket] of perCurrency) {
    const sorted = [...bucket.values()]
      .sort(
        (a, b) => b.amountCents - a.amountCents || a.name.localeCompare(b.name),
      )
      .slice(0, limit);

    result.set(currencyCode, sorted);
  }

  return result;
}

/**
 * Groups everything by currency. Totals are never added across currencies —
 * there are no FX rates in this app, so a single "net worth" number would be
 * meaningless the moment a user holds two currencies.
 */
export function buildCurrencySummaries({
  wallets,
  cards = [],
  monthMovements,
  categoryMovements,
  topCategoryLimit = 5,
}: {
  wallets: WalletBalanceRow[];
  cards?: CardBalanceRow[];
  monthMovements: CurrencyMovement[];
  categoryMovements: CategoryMovement[];
  topCategoryLimit?: number;
}): CurrencySummary[] {
  const monthTotals = sumMonthByCurrency(monthMovements);
  const categoryTotals = topCategoriesByCurrency(
    categoryMovements,
    topCategoryLimit,
  );

  const byCurrency = new Map<string, CurrencySummary>();

  const ensure = (currencyCode: string) => {
    const existing = byCurrency.get(currencyCode);

    if (existing) return existing;

    const created: CurrencySummary = {
      currencyCode,
      walletCount: 0,
      balanceCents: 0,
      projectedBalanceCents: 0,
      cardCount: 0,
      cardOutstandingCents: 0,
      cardAvailableCents: 0,
      netWorthCents: 0,
      incomeCents: 0,
      expenseCents: 0,
      netCents: 0,
      topCategories: [],
    };

    byCurrency.set(currencyCode, created);

    return created;
  };

  for (const wallet of wallets) {
    const summary = ensure(wallet.currencyCode);

    summary.walletCount += 1;
    summary.balanceCents += wallet.balanceCents;
    summary.projectedBalanceCents += wallet.projectedBalanceCents;
  }

  for (const card of cards) {
    const summary = ensure(card.currencyCode);

    summary.cardCount += 1;
    summary.cardOutstandingCents += card.outstandingCents;
    summary.cardAvailableCents += card.availableCents;
  }

  // Only after both loops, so a card-only currency still nets correctly.
  for (const summary of byCurrency.values()) {
    summary.netWorthCents = summary.balanceCents - summary.cardOutstandingCents;
  }

  for (const [currencyCode, totals] of monthTotals) {
    const summary = ensure(currencyCode);

    summary.incomeCents = totals.incomeCents;
    summary.expenseCents = totals.expenseCents;
    summary.netCents = totals.incomeCents - totals.expenseCents;
  }

  for (const [currencyCode, categories] of categoryTotals) {
    ensure(currencyCode).topCategories = categories;
  }

  return [...byCurrency.values()].sort((a, b) =>
    a.currencyCode.localeCompare(b.currencyCode),
  );
}
