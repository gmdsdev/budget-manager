import type { TransactionRow } from "@budget-manager/client";
import { useDeleteTransactionMutation } from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";

import { ConfirmSheet } from "@/components/ui/confirm-sheet";

export function DeleteTransactionSheet({
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
  const isTransfer = Boolean(transaction.transferGroupId);

  return (
    <ConfirmSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("transaction.delete.title", { name: transaction.name })}
      // Deleting a transfer takes both of its legs, which the copy has to say.
      description={t(
        isTransfer
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
      confirmLabel={
        isTransfer
          ? t("transaction.delete.submitTransfer")
          : t("transaction.delete.submit")
      }
      isPending={deleteMutation.isPending}
      onConfirm={() =>
        deleteMutation.mutate(
          { id: transaction.id },
          { onSuccess: () => onOpenChange(false) },
        )
      }
    />
  );
}
