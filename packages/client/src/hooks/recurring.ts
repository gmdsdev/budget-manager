import { t } from "@budget-manager/i18n";
import type {
  RecurrenceType,
  RecurringFormDto,
  RecurringIdDto,
  RecurringKind,
} from "@budget-manager/schemas";
import { useQuery } from "@tanstack/react-query";

import { recurringQueryInput, type RecurringRow } from "../recurring";
import { api } from "../runtime";
import { useApiMutation } from "../use-api-mutation";

export function useRecurringQuery(page = 1) {
  const trpc = api();

  return useQuery({
    ...trpc.recurring.getAll.queryOptions(recurringQueryInput(page)),
    select: (data) => ({
      total: data.total,
      rows: data.rows.map(
        (row): RecurringRow => ({
          ...row,
          kind: row.kind as RecurringKind,
          recurrenceType: row.recurrenceType as RecurrenceType,
        }),
      ),
    }),
  });
}

/**
 * The series a transaction row belongs to. Read from the already-cached list rather
 * than a new endpoint, since the row only needs its schedule and its state.
 */
export function useRecurringSeriesQuery(templateId: string | null) {
  const { data } = useQuery({
    ...api().recurring.getAll.queryOptions({ limit: 100, offset: 0 }),
    enabled: Boolean(templateId),
    select: (result) => result.rows,
  });

  if (!templateId || !data) return undefined;

  const row = data.find((series) => series.id === templateId);

  if (!row) return undefined;

  return {
    ...row,
    kind: row.kind as RecurringKind,
    recurrenceType: row.recurrenceType as RecurrenceType,
  } satisfies RecurringRow;
}

// A series writes occurrences, so everything downstream of them moves too.
function recurringInvalidations() {
  const trpc = api();

  return [
    trpc.recurring.getAll.queryFilter(),
    trpc.transaction.getAll.queryFilter(),
    trpc.transaction.summary.queryFilter(),
    trpc.wallet.getAll.queryFilter(),
    trpc.creditCard.getAll.queryFilter(),
    trpc.creditCard.bills.queryFilter(),
    // The rows a series lays down are spending like any other.
    trpc.budget.getMonth.queryFilter(),
    trpc.budget.periods.queryFilter(),
    trpc.dashboard.getSummary.queryFilter(),
  ];
}

export function useCreateRecurringMutation() {
  return useApiMutation<unknown, RecurringFormDto>({
    mutationFn: api().recurring.create.mutationOptions().mutationFn,
    successMessage: t("recurring.toast.created"),
    invalidateQueries: recurringInvalidations(),
  });
}

export function useUpdateRecurringMutation() {
  return useApiMutation<unknown, RecurringFormDto & { id: string }>({
    mutationFn: api().recurring.update.mutationOptions().mutationFn,
    successMessage: t("recurring.toast.updated"),
    invalidateQueries: recurringInvalidations(),
  });
}

export function useSetRecurringActiveMutation() {
  return useApiMutation<unknown, { id: string; isActive: boolean }>({
    mutationFn: api().recurring.setActive.mutationOptions().mutationFn,
    invalidateQueries: recurringInvalidations(),
  });
}

export function useDeleteRecurringMutation() {
  return useApiMutation<unknown, RecurringIdDto>({
    mutationFn: api().recurring.delete.mutationOptions().mutationFn,
    successMessage: t("recurring.toast.deleted"),
    invalidateQueries: recurringInvalidations(),
  });
}
