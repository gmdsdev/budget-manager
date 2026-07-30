import { PAGE_SIZE, toOffset } from "@/lib/pagination";
import { trpc } from "@/utils/trpc";
import type {
  TransactionKind,
  TransactionStatus,
} from "@budget-manager/schemas";
import { useQuery } from "@tanstack/react-query";
import {
  TRANSACTION_FILTER_ALL,
  type TransactionFiltersState,
  type TransactionRow,
} from "../types";

type TransactionsQueryInput = {
  kind?: TransactionKind;
  status?: TransactionStatus;
  walletId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
  offset: number;
};

export function transactionsQueryInput(
  filters?: TransactionFiltersState,
  page = 1,
): TransactionsQueryInput {
  const input: TransactionsQueryInput = {
    limit: PAGE_SIZE,
    offset: toOffset(page),
  };

  if (!filters) {
    return input;
  }

  if (filters.kind !== TRANSACTION_FILTER_ALL) {
    input.kind = filters.kind;
  }

  if (filters.status !== TRANSACTION_FILTER_ALL) {
    input.status = filters.status;
  }

  if (filters.walletId !== TRANSACTION_FILTER_ALL) {
    input.walletId = filters.walletId;
  }

  if (filters.categoryId !== TRANSACTION_FILTER_ALL) {
    input.categoryId = filters.categoryId;
  }

  if (filters.dateFrom) {
    input.dateFrom = filters.dateFrom;
  }

  if (filters.dateTo) {
    input.dateTo = filters.dateTo;
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
