import { DetailRow, DetailSheet } from "@/components/detail-sheet";
import type { WalletRow } from "@budget-manager/client";
import { useEnumLabels } from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { Button } from "@budget-manager/ui/components/button";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { useState } from "react";

import { ArchiveWalletDialog } from "./archive-wallet-dialog";
import { EditWalletDialog } from "./edit-wallet-dialog";

type NestedDialog = "edit" | "archive" | null;

/** What a wallet row opens: the record in full, with its actions gathered here. */
export function WalletDetailDialog({
  wallet,
  onClose,
}: {
  wallet: WalletRow;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const labels = useEnumLabels();
  const [dialog, setDialog] = useState<NestedDialog>(null);

  const hasPending = wallet.projectedBalanceCents !== wallet.balanceCents;

  return (
    <>
      <DetailSheet
        open={dialog === null}
        onOpenChange={(next) => {
          if (!next && dialog === null) onClose();
        }}
        title={t("wallet.detail.title")}
        description={wallet.name}
        amount={formatMinorUnits(wallet.balanceCents, wallet.currencyCode)}
        negative={wallet.balanceCents < 0}
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog("edit")}>
              {t("common.edit")}
            </Button>
            <Button variant="destructive" onClick={() => setDialog("archive")}>
              {t("common.archive")}
            </Button>
          </>
        }
      >
        <DetailRow label={t("common.type")}>
          {labels.walletType(wallet.type)}
        </DetailRow>
        <DetailRow label={t("common.currency")}>
          {labels.currency(wallet.currencyCode)}
        </DetailRow>
        <DetailRow label={t("wallet.column.openingBalance")}>
          {formatMinorUnits(wallet.openingBalanceCents, wallet.currencyCode)}
        </DetailRow>
        {hasPending ? (
          <DetailRow label={t("wallet.column.balance")}>
            {t("wallet.projected", {
              amount: formatMinorUnits(
                wallet.projectedBalanceCents,
                wallet.currencyCode,
              ),
            })}
          </DetailRow>
        ) : null}
      </DetailSheet>

      {dialog === "edit" && (
        <EditWalletDialog
          key={wallet.id}
          wallet={wallet}
          open
          onOpenChange={(next) => {
            if (!next) onClose();
          }}
        />
      )}
      {dialog === "archive" && (
        <ArchiveWalletDialog
          key={wallet.id}
          wallet={wallet}
          open
          onOpenChange={(next) => {
            if (!next) onClose();
          }}
        />
      )}
    </>
  );
}
