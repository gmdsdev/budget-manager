import {
  RecordFigure,
  RecordGlyph,
  RecordList,
  RecordRow,
} from "@/components/record-row";
import type { CreditCardRow } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { CreditCardIcon } from "@phosphor-icons/react";

export function CreditCardRows({
  cards,
  onSelect,
}: {
  cards: CreditCardRow[];
  onSelect: (card: CreditCardRow) => void;
}) {
  const { t } = useI18n();

  return (
    <RecordList label={t("creditCard.caption")}>
      {cards.map((card) => (
        <RecordRow
            key={card.id}
            label={t("creditCard.detail.open", { name: card.name })}
            onSelect={() => onSelect(card)}
            glyph={
              <RecordGlyph>
                <CreditCardIcon className="size-5" />
              </RecordGlyph>
            }
            primary={card.name}
            // What is owed only means something against what is left, so
            // `available` stays — but on the meta line, not opposite the name:
            // "R$ 11.769,11 available" is wider than "Nubank Mastercard", and
            // the trailing rail wins every argument about width. The cycle and
            // the billing wallet follow it because the filter bar narrows by
            // them; the limit and the projected balance are in the detail dialog.
            meta={[
              card.currencyCode,
              t("creditCard.column.availableValue", {
                amount: formatMinorUnits(card.availableCents, card.currencyCode),
              }),
              t("creditCard.column.cycleValue", {
                closeDay: card.closeDay,
                dueDay: card.dueDay,
              }),
              card.defaultBillingWalletName ?? t("common.none"),
            ]}
            trailing={
              <RecordFigure
                tone={card.outstandingCents > 0 ? "negative" : "default"}
              >
                {formatMinorUnits(card.outstandingCents, card.currencyCode)}
              </RecordFigure>
            }
        />
      ))}
    </RecordList>
  );
}
