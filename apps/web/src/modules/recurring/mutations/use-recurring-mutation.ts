import { useApiMutation } from "@/hooks/use-api-mutation";
import { trpc } from "@/utils/trpc";
import type {
  RecurringFormDto,
  RecurringIdDto,
} from "@budget-manager/schemas";

// A series writes occurrences, so everything downstream of them moves too.
const RECURRING_INVALIDATIONS = [
  trpc.recurring.getAll.queryFilter(),
  trpc.transaction.getAll.queryFilter(),
  trpc.transaction.summary.queryFilter(),
  trpc.wallet.getAll.queryFilter(),
  trpc.creditCard.getAll.queryFilter(),
  trpc.creditCard.bills.queryFilter(),
  trpc.dashboard.getSummary.queryFilter(),
];

export function useCreateRecurringMutation() {
  return useApiMutation<unknown, RecurringFormDto>({
    mutationFn: trpc.recurring.create.mutationOptions().mutationFn,
    successMessage: "Recurring series created",
    invalidateQueries: RECURRING_INVALIDATIONS,
  });
}

export function useUpdateRecurringMutation() {
  return useApiMutation<unknown, RecurringFormDto & { id: string }>({
    mutationFn: trpc.recurring.update.mutationOptions().mutationFn,
    successMessage: "Recurring series updated",
    invalidateQueries: RECURRING_INVALIDATIONS,
  });
}

export function useSetRecurringActiveMutation() {
  return useApiMutation<unknown, { id: string; isActive: boolean }>({
    mutationFn: trpc.recurring.setActive.mutationOptions().mutationFn,
    invalidateQueries: RECURRING_INVALIDATIONS,
  });
}

export function useDeleteRecurringMutation() {
  return useApiMutation<unknown, RecurringIdDto>({
    mutationFn: trpc.recurring.delete.mutationOptions().mutationFn,
    successMessage: "Recurring series deleted",
    invalidateQueries: RECURRING_INVALIDATIONS,
  });
}
