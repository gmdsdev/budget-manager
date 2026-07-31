import { formatDate, parseDateString } from "../../dates";
import {
  type CategoryColor,
  TransactionStatus,
  isTransactionStatus,
  periodRole,
} from "@budget-manager/schemas";

/**
 * A movement total already bucketed by the month it falls in, so one query
 * feeds both the selected month's figures and the trailing trend.
 */
export type TrendMovement = {
  month: string;
  currencyCode: string;
  kind: string;
  status: string;
  totalCents: number;
};

export type CategoryMovement = {
  currencyCode: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  status: string;
  totalCents: number;
};

export type WalletBalanceRow = {
  id: string;
  name: string;
  currencyCode: string;
  balanceCents: number;
  projectedBalanceCents: number;
};

export type CardBalanceRow = {
  id: string;
  name: string;
  currencyCode: string;
  limitCents: number;
  outstandingCents: number;
  availableCents: number;
};

export type CategorySpend = {
  categoryId: string | null;
  name: string;
  /** Null for the uncategorized bucket, which owns no colour to inherit. */
  color: CategoryColor | null;
  amountCents: number;
};

/** One point of the trailing cash-flow series. */
export type MonthPoint = {
  month: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
};

export type WalletSlice = {
  id: string;
  name: string;
  balanceCents: number;
  projectedBalanceCents: number;
};

export type CardSlice = {
  id: string;
  name: string;
  limitCents: number;
  outstandingCents: number;
  availableCents: number;
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
  /** Oldest first, one point per month in the requested window. */
  trend: MonthPoint[];
  wallets: WalletSlice[];
  cards: CardSlice[];
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

/** The `YYYY-MM` months ending at `month`, oldest first. */
export function trailingMonths(month: string, count: number): string[] {
  const anchor = parseDateString(monthRange(month).from);
  const months: string[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const point = new Date(anchor.getFullYear(), anchor.getMonth() - offset, 1);

    months.push(resolveMonth(point));
  }

  return months;
}

function emptyTrend(months: string[]): MonthPoint[] {
  return months.map((month) => ({
    month,
    incomeCents: 0,
    expenseCents: 0,
    netCents: 0,
  }));
}

function trendByCurrency(movements: TrendMovement[], months: string[]) {
  const slotOf = new Map(months.map((month, index) => [month, index]));
  const trends = new Map<string, MonthPoint[]>();

  for (const movement of movements) {
    const slot = slotOf.get(movement.month);
    const role = periodRole(movement.kind);

    if (slot === undefined || role === null || !counts(movement.status)) {
      continue;
    }

    const points = trends.get(movement.currencyCode) ?? emptyTrend(months);
    const point = points[slot];

    if (!point) continue;

    if (role === "income") {
      point.incomeCents += movement.totalCents;
    } else {
      point.expenseCents += movement.totalCents;
    }

    point.netCents = point.incomeCents - point.expenseCents;
    trends.set(movement.currencyCode, points);
  }

  return trends;
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
        color: (movement.categoryColor as CategoryColor | null) ?? null,
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
  trendMonths,
  trendMovements,
  categoryMovements,
  topCategoryLimit = 5,
}: {
  wallets: WalletBalanceRow[];
  cards?: CardBalanceRow[];
  /** The window the trend covers, oldest first; the last one is the month in view. */
  trendMonths: string[];
  trendMovements: TrendMovement[];
  categoryMovements: CategoryMovement[];
  topCategoryLimit?: number;
}): CurrencySummary[] {
  const trends = trendByCurrency(trendMovements, trendMonths);
  const selectedMonth = trendMonths.at(-1);
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
      trend: emptyTrend(trendMonths),
      wallets: [],
      cards: [],
    };

    byCurrency.set(currencyCode, created);

    return created;
  };

  for (const wallet of wallets) {
    const summary = ensure(wallet.currencyCode);

    summary.walletCount += 1;
    summary.balanceCents += wallet.balanceCents;
    summary.projectedBalanceCents += wallet.projectedBalanceCents;
    summary.wallets.push({
      id: wallet.id,
      name: wallet.name,
      balanceCents: wallet.balanceCents,
      projectedBalanceCents: wallet.projectedBalanceCents,
    });
  }

  for (const card of cards) {
    const summary = ensure(card.currencyCode);

    summary.cardCount += 1;
    summary.cardOutstandingCents += card.outstandingCents;
    summary.cardAvailableCents += card.availableCents;
    summary.cards.push({
      id: card.id,
      name: card.name,
      limitCents: card.limitCents,
      outstandingCents: card.outstandingCents,
      availableCents: card.availableCents,
    });
  }

  // Only after both loops, so a card-only currency still nets correctly.
  for (const summary of byCurrency.values()) {
    summary.netWorthCents = summary.balanceCents - summary.cardOutstandingCents;
  }

  // The month in view is the last trend point, so the figures at the top of the
  // dashboard and the last column of its chart cannot disagree.
  for (const [currencyCode, points] of trends) {
    const summary = ensure(currencyCode);
    const selected = points.find((point) => point.month === selectedMonth);

    summary.trend = points;
    summary.incomeCents = selected?.incomeCents ?? 0;
    summary.expenseCents = selected?.expenseCents ?? 0;
    summary.netCents = selected?.netCents ?? 0;
  }

  for (const [currencyCode, categories] of categoryTotals) {
    ensure(currencyCode).topCategories = categories;
  }

  return [...byCurrency.values()].sort((a, b) =>
    a.currencyCode.localeCompare(b.currencyCode),
  );
}
