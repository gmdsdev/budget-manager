import { t } from "@budget-manager/i18n";
import type {
  BudgetFormDto,
  BudgetIdDto,
  BudgetPeriodAmountDto,
  BudgetRecurrenceType,
  CategoryColor,
} from "@budget-manager/schemas";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  type BudgetFiltersState,
  budgetMonthQueryInput,
  type BudgetRow,
  budgetsQueryInput,
} from "../budget";
import { api } from "../runtime";
import { useApiMutation } from "../use-api-mutation";

export function useBudgetsQuery(filters?: BudgetFiltersState, page = 1) {
  const trpc = api();

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

/**
 * The month's limits and what has been spent against them. Unpaginated on purpose —
 * the figures describe the whole month, so there is no page of them.
 * `keepPreviousData` holds the previous month's figures while the next arrive, so
 * stepping through months never drops the card out of the page.
 */
export function useBudgetMonthQuery(month?: string) {
  return useQuery({
    ...api().budget.getMonth.queryOptions(budgetMonthQueryInput(month)),
    placeholderData: keepPreviousData,
  });
}

/** Every month one budget covers. Only fetched while its dialog is open. */
export function useBudgetPeriodsQuery(budgetId: string | null) {
  return useQuery({
    ...api().budget.periods.queryOptions({ id: budgetId ?? "" }),
    enabled: Boolean(budgetId),
  });
}

/**
 * A budget writes months, and every figure derived from them — the month view, a
 * series' own months, and the dashboard widget — has to move with it.
 */
function budgetInvalidations() {
  const trpc = api();

  return [
    trpc.budget.getAll.queryFilter(),
    trpc.budget.getMonth.queryFilter(),
    trpc.budget.periods.queryFilter(),
    trpc.dashboard.getSummary.queryFilter(),
  ];
}

export function useCreateBudgetMutation() {
  return useApiMutation<unknown, BudgetFormDto>({
    mutationFn: api().budget.create.mutationOptions().mutationFn,
    successMessage: t("budget.toast.created"),
    invalidateQueries: budgetInvalidations(),
  });
}

export function useUpdateBudgetMutation() {
  return useApiMutation<unknown, BudgetFormDto & { id: string }>({
    mutationFn: api().budget.update.mutationOptions().mutationFn,
    successMessage: t("budget.toast.updated"),
    invalidateQueries: budgetInvalidations(),
  });
}

export function useSetBudgetActiveMutation() {
  return useApiMutation<unknown, { id: string; isActive: boolean }>({
    mutationFn: api().budget.setActive.mutationOptions().mutationFn,
    invalidateQueries: budgetInvalidations(),
  });
}

export function useDeleteBudgetMutation() {
  return useApiMutation<unknown, BudgetIdDto>({
    mutationFn: api().budget.delete.mutationOptions().mutationFn,
    successMessage: t("budget.toast.deleted"),
    invalidateQueries: budgetInvalidations(),
  });
}

export function useSetBudgetPeriodAmountMutation() {
  return useApiMutation<unknown, BudgetPeriodAmountDto>({
    mutationFn: api().budget.setPeriodAmount.mutationOptions().mutationFn,
    successMessage: t("budget.toast.periodUpdated"),
    invalidateQueries: budgetInvalidations(),
  });
}

export function useResetBudgetPeriodMutation() {
  return useApiMutation<unknown, BudgetIdDto>({
    mutationFn: api().budget.resetPeriod.mutationOptions().mutationFn,
    successMessage: t("budget.toast.periodReset"),
    invalidateQueries: budgetInvalidations(),
  });
}
