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
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { useDeleteTransactionMutation } from "@budget-manager/client/react";
import type { TransactionRow } from "@budget-manager/client";

export function DeleteTransactionDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: TransactionRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, formatDateString } = useI18n();
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
          <AlertDialogTitle>
            {t("transaction.delete.title", { name: transaction.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              transaction.transferGroupId
                ? "transaction.delete.descriptionTransfer"
                : "transaction.delete.description",
              {
                amount: formatMinorUnits(
                  transaction.amountCents,
                  transaction.walletCurrencyCode ?? "BRL",
                ),
                date: formatDateString(transaction.occurrenceDate, "numeric"),
              },
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            {deleteMutation.isPending
              ? t("common.deleting")
              : transaction.transferGroupId
                ? t("transaction.delete.submitTransfer")
                : t("transaction.delete.submit")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
