import { DetailRow, DetailSheet } from "@/components/detail-sheet";
import type { CreditCardRow } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { Button } from "@budget-manager/ui/components/button";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { useState } from "react";

import { ArchiveCreditCardDialog } from "./archive-credit-card-dialog";
import { CreditCardBillsDialog } from "./credit-card-bills-dialog";
import { EditCreditCardDialog } from "./edit-credit-card-dialog";

type NestedDialog = "bills" | "edit" | "archive" | null;

/** What a card row opens: the record in full, with its actions gathered here. */
export function CreditCardDetailDialog({
  card,
  onClose,
}: {
  card: CreditCardRow;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [dialog, setDialog] = useState<NestedDialog>(null);

  /** Dismissing a nested dialog ends the whole interaction, as the old row menu did. */
  function closeNested(next: boolean) {
    if (!next) onClose();
  }

  return (
    <>
      <DetailSheet
        open={dialog === null}
        onOpenChange={(next) => {
          if (!next && dialog === null) onClose();
        }}
        title={t("creditCard.detail.title")}
        description={card.name}
        amount={formatMinorUnits(card.outstandingCents, card.currencyCode)}
        negative={card.outstandingCents > 0}
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog("bills")}>
              {t("creditCard.bills.trigger")}
            </Button>
            <Button variant="outline" onClick={() => setDialog("edit")}>
              {t("common.edit")}
            </Button>
            <Button variant="destructive" onClick={() => setDialog("archive")}>
              {t("common.archive")}
            </Button>
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
          <span className={card.availableCents < 0 ? "text-destructive" : ""}>
            {formatMinorUnits(card.availableCents, card.currencyCode)}
          </span>
        </DetailRow>
      </DetailSheet>

      {dialog === "bills" && (
        <CreditCardBillsDialog
          key={card.id}
          card={card}
          open
          onOpenChange={closeNested}
        />
      )}
      {dialog === "edit" && (
        <EditCreditCardDialog
          key={card.id}
          card={card}
          open
          onOpenChange={closeNested}
        />
      )}
      {dialog === "archive" && (
        <ArchiveCreditCardDialog
          key={card.id}
          card={card}
          open
          onOpenChange={closeNested}
        />
      )}
    </>
  );
}
