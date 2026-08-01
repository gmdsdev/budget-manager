import { trpc } from "@/utils/trpc";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function budgetMonthQueryInput(month?: string) {
  return month ? { month } : {};
}

/**
 * The month's limits and what has been spent against them. Unpaginated on
 * purpose — the figures describe the whole month, so there is no page of them.
 * `keepPreviousData` holds the previous month's figures while the next arrive,
 * so stepping through months never drops the card out of the page.
 */
export function useBudgetMonthQuery(month?: string) {
  return useQuery({
    ...trpc.budget.getMonth.queryOptions(budgetMonthQueryInput(month)),
    placeholderData: keepPreviousData,
  });
}
