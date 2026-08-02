import { type WalletRow } from "@budget-manager/client";
import { useEnumLabels } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { useState } from "react";
import { View } from "react-native";

import { Amount } from "@/components/amount";
import { RowCard } from "@/components/ui/row-card";
import { RowMenu } from "@/components/ui/row-menu";
import { Text } from "@/components/ui/text";

import { ArchiveWalletSheet } from "../archive-wallet-sheet";
import { EditWalletSheet } from "../edit-wallet-sheet";

type RowSheet = "edit" | "archive" | null;

export function WalletRowCard({ wallet }: { wallet: WalletRow }) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const [sheet, setSheet] = useState<RowSheet>(null);
  const hasPending = wallet.projectedBalanceCents !== wallet.balanceCents;

  return (
    <>
      <RowCard
        primary={<Text variant="bodyMedium">{wallet.name}</Text>}
        trailing={
          <View style={{ alignItems: "flex-end" }}>
            <Amount cents={wallet.balanceCents} currencyCode={wallet.currencyCode} />
            {hasPending && (
              <Text variant="tiny" tone="muted">
                {t("wallet.projected", {
                  amount: formatMinorUnits(
                    wallet.projectedBalanceCents,
                    wallet.currencyCode,
                  ),
                })}
              </Text>
            )}
          </View>
        }
        actions={
          <RowMenu
            label={t("common.actionsFor", { name: wallet.name })}
            actions={[
              { label: t("common.edit"), onPress: () => setSheet("edit") },
              {
                label: t("common.archive"),
                destructive: true,
                onPress: () => setSheet("archive"),
              },
            ]}
          />
        }
        details={[
          { label: t("common.type"), value: labels.walletType(wallet.type) },
          { label: t("common.currency"), value: labels.currency(wallet.currencyCode) },
          {
            label: t("wallet.column.openingBalance"),
            value: (
              <Amount
                cents={wallet.openingBalanceCents}
                currencyCode={wallet.currencyCode}
                variant="tiny"
              />
            ),
          },
        ]}
      />

      {sheet === "edit" && (
        <EditWalletSheet
          wallet={wallet}
          open
          onOpenChange={(next) => setSheet(next ? "edit" : null)}
        />
      )}
      {sheet === "archive" && (
        <ArchiveWalletSheet
          wallet={wallet}
          open
          onOpenChange={(next) => setSheet(next ? "archive" : null)}
        />
      )}
    </>
  );
}
