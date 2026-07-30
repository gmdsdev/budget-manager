import { PAGE_SIZE, toOffset } from "@/lib/pagination";
import { trpc } from "@/utils/trpc";
import type {
  TransactionKind,
  TransactionRepeats,
  TransactionStatus,
} from "@budget-manager/schemas";
import { currentMonthRange } from "@budget-manager/ui/lib/date-range";
import { useQuery } from "@tanstack/react-query";
import {
  defaultTransactionFilters,
  parseAccountValue,
  TRANSACTION_FILTER_ALL,
  type TransactionFiltersState,
  type TransactionRow,
} from "../types";

type TransactionsQueryInput = {
  search?: string;
  kind?: TransactionKind;
  status?: TransactionStatus;
  walletId?: string;
  creditCardId?: string;
  categoryId?: string;
  repeats?: TransactionRepeats;
  dateFrom: string;
  dateTo: string;
  limit: number;
  offset: number;
};

/**
 * The date range is part of every request, so a caller with no filters — the
 * route loader — asks for the same current month the page opens on, and a range
 * that somehow arrives empty falls back to it instead of listing all time.
 */
export function transactionsQueryInput(
  filters?: TransactionFiltersState,
  page = 1,
): TransactionsQueryInput {
  const resolved = filters ?? defaultTransactionFilters();
  const fallback = currentMonthRange();

  const input: TransactionsQueryInput = {
    limit: PAGE_SIZE,
    offset: toOffset(page),
    dateFrom: resolved.dateFrom || fallback.from,
    dateTo: resolved.dateTo || fallback.to,
  };

  if (!filters) {
    return input;
  }

  if (filters.search) {
    input.search = filters.search;
  }

  if (filters.accountId !== TRANSACTION_FILTER_ALL) {
    const { walletId, creditCardId } = parseAccountValue(filters.accountId);

    if (walletId) {
      input.walletId = walletId;
    }

    if (creditCardId) {
      input.creditCardId = creditCardId;
    }
  }

  if (filters.categoryId !== TRANSACTION_FILTER_ALL) {
    input.categoryId = filters.categoryId;
  }

  if (filters.kind !== TRANSACTION_FILTER_ALL) {
    input.kind = filters.kind;
  }

  if (filters.repeats !== TRANSACTION_FILTER_ALL) {
    input.repeats = filters.repeats;
  }

  if (filters.status !== TRANSACTION_FILTER_ALL) {
    input.status = filters.status;
  }

  return input;
}

export function useTransactionsQuery(
  filters?: TransactionFiltersState,
  page = 1,
) {
  return useQuery({
    ...trpc.transaction.getAll.queryOptions(
      transactionsQueryInput(filters, page),
    ),
    select: (data) => ({
      total: data.total,
      rows: data.rows.map(
        (row): TransactionRow => ({
          ...row,
          paidAt: row.paidAt ? new Date(row.paidAt) : null,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }),
      ),
    }),
  });
}
