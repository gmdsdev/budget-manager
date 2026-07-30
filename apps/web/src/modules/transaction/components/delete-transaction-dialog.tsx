import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@budget-manager/ui/components/alert-dialog";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { useDeleteTransactionMutation } from "../mutations/use-transaction-mutation";
import type { TransactionRow } from "../types";
import { formatDateString } from "../utils/date";

export function DeleteTransactionDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: TransactionRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteMutation = useDeleteTransactionMutation();

  function handleDelete() {
    deleteMutation.mutate(
      { id: transaction.id },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{transaction.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This{" "}
            {formatMinorUnits(
              transaction.amountCents,
              transaction.walletCurrencyCode ?? "BRL",
            )}{" "}
            {transaction.transferGroupId ? "transfer" : "transaction"} from{" "}
            {formatDateString(transaction.occurrenceDate)} will be permanently
            removed
            {transaction.transferGroupId ? ", including both of its legs" : ""}.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            {deleteMutation.isPending
              ? "Deleting…"
              : transaction.transferGroupId
                ? "Delete transfer"
                : "Delete transaction"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
