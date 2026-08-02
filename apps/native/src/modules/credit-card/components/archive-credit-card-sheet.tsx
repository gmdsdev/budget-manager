import type { CreditCardRow } from "@budget-manager/client";
import { useArchiveCreditCardMutation } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";

import { ConfirmSheet } from "@/components/ui/confirm-sheet";

export function ArchiveCreditCardSheet({
  card,
  open,
  onOpenChange,
}: {
  card: CreditCardRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const archiveMutation = useArchiveCreditCardMutation();

  // What the card still owes leads the sentence, because that is what makes
  // archiving it consequential.
  const owes =
    card.outstandingCents > 0
      ? t("creditCard.archive.stillOwes", {
          amount: formatMinorUnits(card.outstandingCents, card.currencyCode),
        })
      : "";

  return (
    <ConfirmSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("creditCard.archive.title", { name: card.name })}
      description={`${owes}${t("creditCard.archive.description")}`}
      confirmLabel={t("creditCard.archive.submit")}
      pendingLabel={t("creditCard.archive.submitting")}
      isPending={archiveMutation.isPending}
      onConfirm={() =>
        archiveMutation.mutate(
          { id: card.id },
          { onSuccess: () => onOpenChange(false) },
        )
      }
    />
  );
}
