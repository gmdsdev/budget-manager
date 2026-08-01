import { PAGE_SIZE, toOffset } from "@/lib/pagination";
import { trpc } from "@/utils/trpc";
import type {
  BudgetRecurrenceType,
  CategoryColor,
  WalletCurrency,
} from "@budget-manager/schemas";
import { useQuery } from "@tanstack/react-query";
import {
  BUDGET_CATEGORY_FILTER_ALL,
  BUDGET_CURRENCY_FILTER_ALL,
  BUDGET_STATE_ACTIVE,
  BUDGET_STATE_FILTER_ALL,
  type BudgetFiltersState,
  type BudgetRow,
} from "../types";

type BudgetsQueryInput = {
  search?: string;
  categoryId?: string;
  currencyCode?: WalletCurrency;
  isActive?: boolean;
  limit: number;
  offset: number;
};

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

export function useBudgetsQuery(filters?: BudgetFiltersState, page = 1) {
  return useQuery({
    ...trpc.budget.getAll.queryOptions(budgetsQueryInput(filters, page)),
    select: (data) => ({
      total: data.total,
      rows: data.rows.map(
        (row): BudgetRow => ({
          ...row,
          categoryColor: row.categoryColor as CategoryColor,
          recurrenceType: row.recurrenceType as BudgetRecurrenceType,
        }),
      ),
    }),
  });
}
