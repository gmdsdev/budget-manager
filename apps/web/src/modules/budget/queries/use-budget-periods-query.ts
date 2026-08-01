import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

/** Every month one budget covers. Only fetched while its dialog is open. */
export function useBudgetPeriodsQuery(budgetId: string | null) {
  return useQuery({
    ...trpc.budget.periods.queryOptions({ id: budgetId ?? "" }),
    enabled: Boolean(budgetId),
  });
}
