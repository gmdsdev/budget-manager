import { PAGE_SIZE, toOffset } from "@/lib/pagination";
import { trpc } from "@/utils/trpc";
import type { RecurrenceType, RecurringKind } from "@budget-manager/schemas";
import { useQuery } from "@tanstack/react-query";
import type { RecurringRow } from "../types";

export function recurringQueryInput(page = 1) {
  return { limit: PAGE_SIZE, offset: toOffset(page) };
}

export function useRecurringQuery(page = 1) {
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
 * The series a transaction row belongs to. Read from the already-cached list
 * rather than a new endpoint, since the row only needs its schedule and state.
 */
export function useRecurringSeriesQuery(templateId: string | null) {
  const { data } = useQuery({
    ...trpc.recurring.getAll.queryOptions({ limit: 100, offset: 0 }),
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
