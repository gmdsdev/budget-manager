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
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { useArchiveCreditCardMutation } from "@budget-manager/client/react";
import type { CreditCardRow } from "@budget-manager/client";

export function ArchiveCreditCardDialog({
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

  function handleArchive() {
    archiveMutation.mutate(
      { id: card.id },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("creditCard.archive.title", { name: card.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {card.outstandingCents > 0
              ? t("creditCard.archive.stillOwes", {
                  amount: formatMinorUnits(
                    card.outstandingCents,
                    card.currencyCode,
                  ),
                })
              : ""}
            {t("creditCard.archive.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={archiveMutation.isPending}
            onClick={handleArchive}
          >
            {archiveMutation.isPending
              ? t("creditCard.archive.submitting")
              : t("creditCard.archive.submit")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
