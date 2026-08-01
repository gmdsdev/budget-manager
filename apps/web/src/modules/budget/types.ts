import {
  type BudgetRecurrenceType,
  type BudgetStatus,
  type CategoryColor,
  FILTER_ALL,
} from "@budget-manager/schemas";

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
