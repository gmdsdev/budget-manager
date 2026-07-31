import { trpc } from "@/utils/trpc";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { TransactionFiltersState } from "../types";
import {
  transactionFiltersInput,
  type TransactionFiltersInput,
} from "./use-transactions-query";

/**
 * The filters without the page: the totals describe every matching row, so
 * paging the list must not refetch them — and switching pages back and forth
 * keeps hitting the same cache entry.
 */
export function transactionSummaryQueryInput(
  filters?: TransactionFiltersState,
): TransactionFiltersInput {
  return transactionFiltersInput(filters);
}

export function useTransactionSummaryQuery(filters?: TransactionFiltersState) {
  return useQuery({
    ...trpc.transaction.summary.queryOptions(
      transactionSummaryQueryInput(filters),
    ),
    // A new filter holds the previous figures at reduced opacity rather than
    // dropping the table out of the page and pushing the pagination around.
    placeholderData: keepPreviousData,
  });
}
