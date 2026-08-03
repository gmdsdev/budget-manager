import type { WalletRow } from "@budget-manager/client";
import { useEnumLabels } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { useState } from "react";

import { DetailRow, DetailSheet } from "@/components/detail-sheet";
import { Button } from "@/components/ui/button";

import { ArchiveWalletSheet } from "./archive-wallet-sheet";
import { EditWalletSheet } from "./edit-wallet-sheet";

type NestedSheet = "edit" | "archive" | null;

/** What a wallet row opens: the record in full, with its actions gathered here. */
export function WalletDetailSheet({
  wallet,
  onClose,
}: {
  wallet: WalletRow;
  onClose: () => void;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const [sheet, setSheet] = useState<NestedSheet>(null);

  const hasPending = wallet.projectedBalanceCents !== wallet.balanceCents;

  function closeNested(next: boolean) {
    if (!next) onClose();
  }

  return (
    <>
      <DetailSheet
        open={sheet === null}
        onOpenChange={(next) => {
          if (!next && sheet === null) onClose();
        }}
        title={t("wallet.detail.title")}
        description={wallet.name}
        amount={formatMinorUnits(wallet.balanceCents, wallet.currencyCode)}
        negative={wallet.balanceCents < 0}
        actions={
          <>
            <Button
              variant="outline"
              label={t("common.edit")}
              onPress={() => setSheet("edit")}
            />
            <Button
              variant="destructive"
              label={t("common.archive")}
              onPress={() => setSheet("archive")}
            />
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

      {sheet === "edit" && (
        <EditWalletSheet
          key={wallet.id}
          wallet={wallet}
          open
          onOpenChange={closeNested}
        />
      )}
      {sheet === "archive" && (
        <ArchiveWalletSheet
          key={wallet.id}
          wallet={wallet}
          open
          onOpenChange={closeNested}
        />
      )}
    </>
  );
}
