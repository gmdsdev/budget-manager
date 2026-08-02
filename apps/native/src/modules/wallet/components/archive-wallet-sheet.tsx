import type { WalletRow } from "@budget-manager/client";
import { useArchiveWalletMutation } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";

import { ConfirmSheet } from "@/components/ui/confirm-sheet";

export function ArchiveWalletSheet({
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

  return (
    <ConfirmSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("wallet.archive.title", { name: wallet.name })}
      description={t("wallet.archive.description", {
        balance: formatMinorUnits(wallet.openingBalanceCents, wallet.currencyCode),
      })}
      confirmLabel={t("wallet.archive.submit")}
      pendingLabel={t("wallet.archive.submitting")}
      isPending={archiveMutation.isPending}
      onConfirm={() =>
        archiveMutation.mutate(
          { id: wallet.id },
          { onSuccess: () => onOpenChange(false) },
        )
      }
    />
  );
}
