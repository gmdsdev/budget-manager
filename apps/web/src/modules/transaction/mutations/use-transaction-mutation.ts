import { useApiMutation } from "@/hooks/use-api-mutation";
import { trpc } from "@/utils/trpc";
import { t } from "@budget-manager/i18n";
import type {
  CardPaymentFormDto,
  CardPurchaseFormDto,
  DeleteTransactionDto,
  TransactionFormDto,
  TransferFormDto,
  TransferGroupIdDto,
} from "@budget-manager/schemas";

const TRANSACTION_INVALIDATIONS = [
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

export function useCreateTransactionMutation() {
  return useApiMutation<unknown, TransactionFormDto>({
    mutationFn: trpc.transaction.create.mutationOptions().mutationFn,
    successMessage: t("transaction.toast.created"),
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useUpdateTransactionMutation() {
  return useApiMutation<unknown, TransactionFormDto & { id: string }>({
    mutationFn: trpc.transaction.update.mutationOptions().mutationFn,
    successMessage: t("transaction.toast.updated"),
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useCreateTransferMutation() {
  return useApiMutation<unknown, TransferFormDto>({
    mutationFn: trpc.transaction.createTransfer.mutationOptions().mutationFn,
    successMessage: t("transfer.toast.created"),
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useUpdateTransferMutation() {
  return useApiMutation<unknown, TransferFormDto & { transferGroupId: string }>({
    mutationFn: trpc.transaction.updateTransfer.mutationOptions().mutationFn,
    successMessage: t("transfer.toast.updated"),
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useDeleteTransferMutation() {
  return useApiMutation<unknown, TransferGroupIdDto>({
    mutationFn: trpc.transaction.deleteTransfer.mutationOptions().mutationFn,
    successMessage: t("transfer.toast.deleted"),
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useMarkTransactionPaidMutation() {
  return useApiMutation<unknown, DeleteTransactionDto>({
    mutationFn: trpc.transaction.markPaid.mutationOptions().mutationFn,
    successMessage: t("transaction.toast.markedPaid"),
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useDeleteTransactionMutation() {
  return useApiMutation<unknown, DeleteTransactionDto>({
    mutationFn: trpc.transaction.delete.mutationOptions().mutationFn,
    successMessage: t("transaction.toast.deleted"),
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useCreateCardPurchaseMutation() {
  return useApiMutation<unknown, CardPurchaseFormDto>({
    mutationFn: trpc.transaction.createCardPurchase.mutationOptions().mutationFn,
    successMessage: t("cardPurchase.toast.created"),
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useUpdateCardPurchaseMutation() {
  return useApiMutation<unknown, CardPurchaseFormDto & { id: string }>({
    mutationFn: trpc.transaction.updateCardPurchase.mutationOptions().mutationFn,
    successMessage: t("cardPurchase.toast.updated"),
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useCreateCardPaymentMutation() {
  return useApiMutation<unknown, CardPaymentFormDto>({
    mutationFn: trpc.transaction.createCardPayment.mutationOptions().mutationFn,
    successMessage: t("cardPayment.toast.created"),
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useUpdateCardPaymentMutation() {
  return useApiMutation<unknown, CardPaymentFormDto & { id: string }>({
    mutationFn: trpc.transaction.updateCardPayment.mutationOptions().mutationFn,
    successMessage: t("cardPayment.toast.updated"),
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}
