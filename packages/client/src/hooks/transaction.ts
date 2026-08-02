import { t } from "@budget-manager/i18n";
import type {
  CardPaymentFormDto,
  CardPurchaseFormDto,
  DeleteTransactionDto,
  TransactionFormDto,
  TransactionKind,
  TransferFormDto,
  TransferGroupIdDto,
} from "@budget-manager/schemas";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "../runtime";
import {
  type TransactionFiltersState,
  type TransactionRow,
  transactionSummaryQueryInput,
  transactionsQueryInput,
} from "../transaction";
import { useApiMutation } from "../use-api-mutation";

export function useTransactionsQuery(
  filters?: TransactionFiltersState,
  page = 1,
) {
  const trpc = api();

  return useQuery({
    ...trpc.transaction.getAll.queryOptions(transactionsQueryInput(filters, page)),
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

/**
 * Its own query, keyed on the filters alone: the totals cover every matching row, so
 * turning a page must neither change them nor refetch them. `keepPreviousData` holds
 * the previous figures rather than dropping the table out of the page.
 */
export function useTransactionSummaryQuery(filters?: TransactionFiltersState) {
  return useQuery({
    ...api().transaction.summary.queryOptions(
      transactionSummaryQueryInput(filters),
    ),
    placeholderData: keepPreviousData,
  });
}

export type TransferLeg = {
  id: string;
  kind: TransactionKind;
  walletId: string | null;
};

/** A transfer is two rows sharing a group id; an editor needs both legs. */
export function useTransferQuery(transferGroupId: string) {
  return useQuery({
    ...api().transaction.getTransfer.queryOptions({ transferGroupId }),
    select: (rows): TransferLeg[] =>
      rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        walletId: row.walletId,
      })),
  });
}

/**
 * Wallet balances, card outstanding figures, statement totals and budget meters are all
 * derived from these rows, so a mutation here has to reach every one of them.
 */
function transactionInvalidations() {
  const trpc = api();

  return [
    trpc.transaction.getAll.queryFilter(),
    // The figures under the list are derived, so they move with every row.
    trpc.transaction.summary.queryFilter(),
    trpc.transaction.getTransfer.queryFilter(),
    trpc.wallet.getAll.queryFilter(),
    // Card purchases and payments move a card's outstanding balance.
    trpc.creditCard.getAll.queryFilter(),
    trpc.creditCard.bills.queryFilter(),
    // A budget measures spending, so a row is exactly what moves its meters.
    trpc.budget.getMonth.queryFilter(),
    trpc.budget.periods.queryFilter(),
    trpc.dashboard.getSummary.queryFilter(),
  ];
}

export function useCreateTransactionMutation() {
  return useApiMutation<unknown, TransactionFormDto>({
    mutationFn: api().transaction.create.mutationOptions().mutationFn,
    successMessage: t("transaction.toast.created"),
    invalidateQueries: transactionInvalidations(),
  });
}

export function useUpdateTransactionMutation() {
  return useApiMutation<unknown, TransactionFormDto & { id: string }>({
    mutationFn: api().transaction.update.mutationOptions().mutationFn,
    successMessage: t("transaction.toast.updated"),
    invalidateQueries: transactionInvalidations(),
  });
}

export function useCreateTransferMutation() {
  return useApiMutation<unknown, TransferFormDto>({
    mutationFn: api().transaction.createTransfer.mutationOptions().mutationFn,
    successMessage: t("transfer.toast.created"),
    invalidateQueries: transactionInvalidations(),
  });
}

export function useUpdateTransferMutation() {
  return useApiMutation<unknown, TransferFormDto & { transferGroupId: string }>({
    mutationFn: api().transaction.updateTransfer.mutationOptions().mutationFn,
    successMessage: t("transfer.toast.updated"),
    invalidateQueries: transactionInvalidations(),
  });
}

export function useDeleteTransferMutation() {
  return useApiMutation<unknown, TransferGroupIdDto>({
    mutationFn: api().transaction.deleteTransfer.mutationOptions().mutationFn,
    successMessage: t("transfer.toast.deleted"),
    invalidateQueries: transactionInvalidations(),
  });
}

export function useMarkTransactionPaidMutation() {
  return useApiMutation<unknown, DeleteTransactionDto>({
    mutationFn: api().transaction.markPaid.mutationOptions().mutationFn,
    successMessage: t("transaction.toast.markedPaid"),
    invalidateQueries: transactionInvalidations(),
  });
}

export function useDeleteTransactionMutation() {
  return useApiMutation<unknown, DeleteTransactionDto>({
    mutationFn: api().transaction.delete.mutationOptions().mutationFn,
    successMessage: t("transaction.toast.deleted"),
    invalidateQueries: transactionInvalidations(),
  });
}

export function useCreateCardPurchaseMutation() {
  return useApiMutation<unknown, CardPurchaseFormDto>({
    mutationFn: api().transaction.createCardPurchase.mutationOptions().mutationFn,
    successMessage: t("cardPurchase.toast.created"),
    invalidateQueries: transactionInvalidations(),
  });
}

export function useUpdateCardPurchaseMutation() {
  return useApiMutation<unknown, CardPurchaseFormDto & { id: string }>({
    mutationFn: api().transaction.updateCardPurchase.mutationOptions().mutationFn,
    successMessage: t("cardPurchase.toast.updated"),
    invalidateQueries: transactionInvalidations(),
  });
}

export function useCreateCardPaymentMutation() {
  return useApiMutation<unknown, CardPaymentFormDto>({
    mutationFn: api().transaction.createCardPayment.mutationOptions().mutationFn,
    successMessage: t("cardPayment.toast.created"),
    invalidateQueries: transactionInvalidations(),
  });
}

export function useUpdateCardPaymentMutation() {
  return useApiMutation<unknown, CardPaymentFormDto & { id: string }>({
    mutationFn: api().transaction.updateCardPayment.mutationOptions().mutationFn,
    successMessage: t("cardPayment.toast.updated"),
    invalidateQueries: transactionInvalidations(),
  });
}
