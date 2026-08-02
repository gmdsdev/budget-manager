import {
  type BudgetRecurrenceType,
  type BudgetStatus,
  type CategoryColor,
  FILTER_ALL,
  type WalletCurrency,
} from "@budget-manager/schemas";

import { PAGE_SIZE, toOffset } from "./pagination";

export type BudgetRow = {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: CategoryColor;
  currencyCode: string;
  amountCents: number;
  recurrenceType: BudgetRecurrenceType;
  interval: number;
  installments: number | null;
  startsOn: string;
  endsOn: string | null;
  isActive: boolean;
  periodCount: number;
};

/** One month of a budget, paired with what that month actually cost. */
export type BudgetProgressRow = {
  periodId: string;
  budgetId: string | null;
  categoryId: string;
  categoryName: string;
  categoryColor: CategoryColor;
  currencyCode: string;
  periodMonth: string;
  limitCents: number;
  spentCents: number;
  projectedSpentCents: number;
  remainingCents: number;
  usedRatio: number;
  status: BudgetStatus;
  isOverride: boolean;
};

export type BudgetTotalsRow = {
  currencyCode: string;
  budgetCount: number;
  limitCents: number;
  spentCents: number;
  projectedSpentCents: number;
  remainingCents: number;
  exceededCount: number;
};

export const BUDGET_CATEGORY_FILTER_ALL = FILTER_ALL;
export const BUDGET_CURRENCY_FILTER_ALL = FILTER_ALL;
export const BUDGET_STATE_FILTER_ALL = FILTER_ALL;

export const BUDGET_STATE_ACTIVE = "active";
export const BUDGET_STATE_PAUSED = "paused";

export type BudgetStateFilterValue =
  | typeof BUDGET_STATE_FILTER_ALL
  | typeof BUDGET_STATE_ACTIVE
  | typeof BUDGET_STATE_PAUSED;

export type BudgetFiltersState = {
  search: string;
  categoryId: string;
  currencyCode: string;
  state: BudgetStateFilterValue;
};

export const EMPTY_BUDGET_FILTERS: BudgetFiltersState = {
  search: "",
  categoryId: BUDGET_CATEGORY_FILTER_ALL,
  currencyCode: BUDGET_CURRENCY_FILTER_ALL,
  state: BUDGET_STATE_FILTER_ALL,
};

export function isBudgetFiltered(filters: BudgetFiltersState) {
  return (
    filters.search !== "" ||
    filters.categoryId !== BUDGET_CATEGORY_FILTER_ALL ||
    filters.currencyCode !== BUDGET_CURRENCY_FILTER_ALL ||
    filters.state !== BUDGET_STATE_FILTER_ALL
  );
}

export type BudgetsQueryInput = {
  search?: string;
  categoryId?: string;
  currencyCode?: WalletCurrency;
  isActive?: boolean;
  limit: number;
  offset: number;
};

/**
 * The sentinel values are dropped here and nowhere else. Called with no arguments
 * by a route loader, so it has to work bare.
 */
export function budgetsQueryInput(
  filters?: BudgetFiltersState,
  page = 1,
): BudgetsQueryInput {
  const input: BudgetsQueryInput = {
    limit: PAGE_SIZE,
    offset: toOffset(page),
  };

  if (!filters) {
    return input;
  }

  if (filters.search) {
    input.search = filters.search;
  }

  if (filters.categoryId !== BUDGET_CATEGORY_FILTER_ALL) {
    input.categoryId = filters.categoryId;
  }

  if (filters.currencyCode !== BUDGET_CURRENCY_FILTER_ALL) {
    input.currencyCode = filters.currencyCode as WalletCurrency;
  }

  if (filters.state !== BUDGET_STATE_FILTER_ALL) {
    input.isActive = filters.state === BUDGET_STATE_ACTIVE;
  }

  return input;
}

/**
 * The month card asks for an **explicit** month: a bare call would sit under a
 * different query key than the screen's own, leaving the card loading on every visit.
 */
export function budgetMonthQueryInput(month?: string) {
  return month ? { month } : {};
}
