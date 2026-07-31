import { useApiMutation } from "@/hooks/use-api-mutation";
import { trpc } from "@/utils/trpc";
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
  trpc.dashboard.getSummary.queryFilter(),
];

export function useCreateTransactionMutation() {
  return useApiMutation<unknown, TransactionFormDto>({
    mutationFn: trpc.transaction.create.mutationOptions().mutationFn,
    successMessage: "Transaction created successfully",
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useUpdateTransactionMutation() {
  return useApiMutation<unknown, TransactionFormDto & { id: string }>({
    mutationFn: trpc.transaction.update.mutationOptions().mutationFn,
    successMessage: "Transaction updated successfully",
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useCreateTransferMutation() {
  return useApiMutation<unknown, TransferFormDto>({
    mutationFn: trpc.transaction.createTransfer.mutationOptions().mutationFn,
    successMessage: "Transfer created successfully",
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useUpdateTransferMutation() {
  return useApiMutation<unknown, TransferFormDto & { transferGroupId: string }>({
    mutationFn: trpc.transaction.updateTransfer.mutationOptions().mutationFn,
    successMessage: "Transfer updated successfully",
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useDeleteTransferMutation() {
  return useApiMutation<unknown, TransferGroupIdDto>({
    mutationFn: trpc.transaction.deleteTransfer.mutationOptions().mutationFn,
    successMessage: "Transfer deleted successfully",
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useMarkTransactionPaidMutation() {
  return useApiMutation<unknown, DeleteTransactionDto>({
    mutationFn: trpc.transaction.markPaid.mutationOptions().mutationFn,
    successMessage: "Transaction marked as paid",
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useDeleteTransactionMutation() {
  return useApiMutation<unknown, DeleteTransactionDto>({
    mutationFn: trpc.transaction.delete.mutationOptions().mutationFn,
    successMessage: "Transaction deleted successfully",
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useCreateCardPurchaseMutation() {
  return useApiMutation<unknown, CardPurchaseFormDto>({
    mutationFn: trpc.transaction.createCardPurchase.mutationOptions().mutationFn,
    successMessage: "Card purchase recorded",
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useUpdateCardPurchaseMutation() {
  return useApiMutation<unknown, CardPurchaseFormDto & { id: string }>({
    mutationFn: trpc.transaction.updateCardPurchase.mutationOptions().mutationFn,
    successMessage: "Card purchase updated",
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useCreateCardPaymentMutation() {
  return useApiMutation<unknown, CardPaymentFormDto>({
    mutationFn: trpc.transaction.createCardPayment.mutationOptions().mutationFn,
    successMessage: "Card payment recorded",
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}

export function useUpdateCardPaymentMutation() {
  return useApiMutation<unknown, CardPaymentFormDto & { id: string }>({
    mutationFn: trpc.transaction.updateCardPayment.mutationOptions().mutationFn,
    successMessage: "Card payment updated",
    invalidateQueries: TRANSACTION_INVALIDATIONS,
  });
}
