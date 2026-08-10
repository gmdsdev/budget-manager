import type { CreditCardRow } from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { Feather } from "@expo/vector-icons";

import { RecordGlyph, RecordList, RecordRow } from "@/components/record-row";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";

export function CreditCardRows({
  cards,
  onSelect,
}: {
  cards: CreditCardRow[];
  onSelect: (card: CreditCardRow) => void;
}) {
  const t = useTranslate();
  const colors = useColors();

  return (
    <RecordList label={t("creditCard.caption")}>
      {cards.map((card) => {
        const hasPending =
          card.projectedOutstandingCents !== card.outstandingCents;

        return (
          <RecordRow
            key={card.id}
            label={t("creditCard.detail.open", { name: card.name })}
            onSelect={() => onSelect(card)}
            glyph={
              <RecordGlyph>
                <Feather
                  name="credit-card"
                  size={20}
                  color={colors.mutedForeground}
                />
              </RecordGlyph>
            }
            primary={card.name}
            // What is owed only means something against what is left, so `available`
            // stays — but on the *meta* line, not opposite the name. Anything in the
            // trailing column is measured against the name for width and wins, and
            // "R$ 11.769,11 available" is wider than "Nubank Mastercard": the figure
            // column kept the amount and the name was cut to "Nubank Master…".
            //
            // `available` leads, and the currency code follows it. The line clips to
            // one line rather than wrapping, so a phone shows only the first part or
            // two — and with the code first, the one figure that gives `outstanding`
            // its meaning was the half that got cut. The code is still stated, which
            // is what the Currency filter reads as, but it is the part worth losing:
            // the figure beside it already carries the currency's own symbol.
            //
            // The cycle days, the limit and the billing wallet are configuration
            // rather than a reading, and live in the detail sheet.
            meta={[
              t("creditCard.column.availableValue", {
                amount: formatMinorUnits(card.availableCents, card.currencyCode),
              }),
              card.currencyCode,
            ]}
            trailing={
              <>
                <Text
                  variant="figureRow"
                  tone={card.outstandingCents > 0 ? "destructive" : "default"}
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatMinorUnits(card.outstandingCents, card.currencyCode)}
                </Text>
                {hasPending ? (
                  <Text variant="meta" tone="muted">
                    {t("wallet.pending")}
                  </Text>
                ) : null}
              </>
            }
          />
        );
      })}
    </RecordList>
  );
}
