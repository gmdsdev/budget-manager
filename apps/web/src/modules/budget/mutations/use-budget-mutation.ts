import { useApiMutation } from "@/hooks/use-api-mutation";
import { trpc } from "@/utils/trpc";
import { t } from "@budget-manager/i18n";
import type {
  BudgetFormDto,
  BudgetIdDto,
  BudgetPeriodAmountDto,
} from "@budget-manager/schemas";

/**
 * A budget writes months, and every figure derived from them — the month view,
 * a series' own months, and the dashboard widget — has to move with it.
 */
const BUDGET_INVALIDATIONS = [
  trpc.budget.getAll.queryFilter(),
  trpc.budget.getMonth.queryFilter(),
  trpc.budget.periods.queryFilter(),
  trpc.dashboard.getSummary.queryFilter(),
];

export function useCreateBudgetMutation() {
  return useApiMutation<unknown, BudgetFormDto>({
    mutationFn: trpc.budget.create.mutationOptions().mutationFn,
    successMessage: t("budget.toast.created"),
    invalidateQueries: BUDGET_INVALIDATIONS,
  });
}

export function useUpdateBudgetMutation() {
  return useApiMutation<unknown, BudgetFormDto & { id: string }>({
    mutationFn: trpc.budget.update.mutationOptions().mutationFn,
    successMessage: t("budget.toast.updated"),
    invalidateQueries: BUDGET_INVALIDATIONS,
  });
}

export function useSetBudgetActiveMutation() {
  return useApiMutation<unknown, { id: string; isActive: boolean }>({
    mutationFn: trpc.budget.setActive.mutationOptions().mutationFn,
    invalidateQueries: BUDGET_INVALIDATIONS,
  });
}

export function useDeleteBudgetMutation() {
  return useApiMutation<unknown, BudgetIdDto>({
    mutationFn: trpc.budget.delete.mutationOptions().mutationFn,
    successMessage: t("budget.toast.deleted"),
    invalidateQueries: BUDGET_INVALIDATIONS,
  });
}

export function useSetBudgetPeriodAmountMutation() {
  return useApiMutation<unknown, BudgetPeriodAmountDto>({
    mutationFn: trpc.budget.setPeriodAmount.mutationOptions().mutationFn,
    successMessage: t("budget.toast.periodUpdated"),
    invalidateQueries: BUDGET_INVALIDATIONS,
  });
}

export function useResetBudgetPeriodMutation() {
  return useApiMutation<unknown, BudgetIdDto>({
    mutationFn: trpc.budget.resetPeriod.mutationOptions().mutationFn,
    successMessage: t("budget.toast.periodReset"),
    invalidateQueries: BUDGET_INVALIDATIONS,
  });
}
