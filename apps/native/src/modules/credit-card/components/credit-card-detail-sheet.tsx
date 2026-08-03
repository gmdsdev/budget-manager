import type { CreditCardRow } from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { useState } from "react";

import { DetailRow, DetailSheet } from "@/components/detail-sheet";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import { ArchiveCreditCardSheet } from "./archive-credit-card-sheet";
import { CreditCardBillsSheet } from "./credit-card-bills-sheet";
import { EditCreditCardSheet } from "./edit-credit-card-sheet";

type NestedSheet = "bills" | "edit" | "archive" | null;

/** What a card row opens: the record in full, with its actions gathered here. */
export function CreditCardDetailSheet({
  card,
  onClose,
}: {
  card: CreditCardRow;
  onClose: () => void;
}) {
  const t = useTranslate();
  const [sheet, setSheet] = useState<NestedSheet>(null);

  /** Dismissing a nested sheet ends the whole interaction, as the row menu did. */
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
        title={t("creditCard.detail.title")}
        description={card.name}
        amount={formatMinorUnits(card.outstandingCents, card.currencyCode)}
        negative={card.outstandingCents > 0}
        actions={
          <>
            <Button
              variant="outline"
              label={t("creditCard.bills.trigger")}
              onPress={() => setSheet("bills")}
            />
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
        <DetailRow label={t("common.currency")}>{card.currencyCode}</DetailRow>
        <DetailRow label={t("creditCard.column.cycle")}>
          {t("creditCard.column.cycleValue", {
            closeDay: card.closeDay,
            dueDay: card.dueDay,
          })}
        </DetailRow>
        <DetailRow label={t("creditCard.column.billingWallet")}>
          {card.defaultBillingWalletName ?? t("common.none")}
        </DetailRow>
        <DetailRow label={t("creditCard.column.limit")}>
          {formatMinorUnits(card.limitCents, card.currencyCode)}
        </DetailRow>
        <DetailRow label={t("creditCard.column.available")}>
          <Text
            variant="metaMedium"
            tone={card.availableCents < 0 ? "destructive" : "default"}
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formatMinorUnits(card.availableCents, card.currencyCode)}
          </Text>
        </DetailRow>
      </DetailSheet>

      {sheet === "bills" && (
        <CreditCardBillsSheet
          key={card.id}
          card={card}
          open
          onOpenChange={closeNested}
        />
      )}
      {sheet === "edit" && (
        <EditCreditCardSheet
          key={card.id}
          card={card}
          open
          onOpenChange={closeNested}
        />
      )}
      {sheet === "archive" && (
        <ArchiveCreditCardSheet
          key={card.id}
          card={card}
          open
          onOpenChange={closeNested}
        />
      )}
    </>
  );
}
