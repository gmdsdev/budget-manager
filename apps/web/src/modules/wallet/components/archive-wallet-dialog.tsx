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
import { useArchiveWalletMutation } from "../mutations/use-wallet-mutation";
import type { WalletRow } from "../types";

export function ArchiveWalletDialog({
  wallet,
  open,
  onOpenChange,
}: {
  wallet: WalletRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const archiveMutation = useArchiveWalletMutation();

  function handleArchive() {
    archiveMutation.mutate(
      { id: wallet.id },
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
            {t("wallet.archive.title", { name: wallet.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("wallet.archive.description", {
              balance: formatMinorUnits(
                wallet.openingBalanceCents,
                wallet.currencyCode,
              ),
            })}
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
              ? t("wallet.archive.submitting")
              : t("wallet.archive.submit")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
