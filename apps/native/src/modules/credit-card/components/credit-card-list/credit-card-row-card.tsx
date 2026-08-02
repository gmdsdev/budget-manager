import { type CreditCardRow } from "@budget-manager/client";
import { useEnumLabels } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { useState } from "react";
import { View } from "react-native";

import { Amount } from "@/components/amount";
import { RowCard } from "@/components/ui/row-card";
import { RowMenu } from "@/components/ui/row-menu";
import { Text } from "@/components/ui/text";
import {
  ArchiveCreditCardSheet,
} from "@/modules/credit-card/components/archive-credit-card-sheet";
import {
  CreditCardBillsSheet,
} from "@/modules/credit-card/components/credit-card-bills-sheet";
import {
  EditCreditCardSheet,
} from "@/modules/credit-card/components/edit-credit-card-sheet";

type RowSheet = "edit" | "archive" | "bills" | null;

export function CreditCardRowCard({ card }: { card: CreditCardRow }) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const [sheet, setSheet] = useState<RowSheet>(null);
  const hasPending = card.projectedOutstandingCents !== card.outstandingCents;

  return (
    <>
      <RowCard
        primary={<Text variant="bodyMedium">{card.name}</Text>}
        trailing={
          <View style={{ alignItems: "flex-end" }}>
            {/* Outstanding is a debt, so any amount owed reads as such. */}
            <Text
              variant="body"
              tone={card.outstandingCents > 0 ? "destructive" : "default"}
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {formatMinorUnits(card.outstandingCents, card.currencyCode)}
            </Text>
            {hasPending && (
              <Text variant="tiny" tone="muted">
                {t("creditCard.projected", {
                  amount: formatMinorUnits(
                    card.projectedOutstandingCents,
                    card.currencyCode,
                  ),
                })}
              </Text>
            )}
          </View>
        }
        actions={
          <RowMenu
            label={t("common.actionsFor", { name: card.name })}
            actions={[
              { label: t("creditCard.bills.trigger"), onPress: () => setSheet("bills") },
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
          { label: t("common.currency"), value: labels.currency(card.currencyCode) },
          {
            label: t("creditCard.column.cycle"),
            value: t("creditCard.column.cycleValue", {
              closeDay: card.closeDay,
              dueDay: card.dueDay,
            }),
          },
          {
            label: t("creditCard.column.billingWallet"),
            value: card.defaultBillingWalletName ?? t("common.none"),
          },
          {
            label: t("creditCard.column.limit"),
            value: (
              <Amount
                cents={card.limitCents}
                currencyCode={card.currencyCode}
                variant="tiny"
              />
            ),
          },
          {
            label: t("creditCard.column.available"),
            value: (
              <Amount
                cents={card.availableCents}
                currencyCode={card.currencyCode}
                variant="tiny"
              />
            ),
          },
        ]}
      />

      {sheet === "bills" && (
        <CreditCardBillsSheet
          card={card}
          open
          onOpenChange={(next) => setSheet(next ? "bills" : null)}
        />
      )}
      {sheet === "edit" && (
        <EditCreditCardSheet
          card={card}
          open
          onOpenChange={(next) => setSheet(next ? "edit" : null)}
        />
      )}
      {sheet === "archive" && (
        <ArchiveCreditCardSheet
          card={card}
          open
          onOpenChange={(next) => setSheet(next ? "archive" : null)}
        />
      )}
    </>
  );
}
