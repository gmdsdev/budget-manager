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
            // column kept the amount and the name was cut to "Nubank Master…". The
            // meta line is allowed to wrap; the name is not allowed to truncate.
            //
            // The cycle days, the limit and the billing wallet are configuration
            // rather than a reading, and live in the detail sheet.
            meta={[
              card.currencyCode,
              t("creditCard.column.availableValue", {
                amount: formatMinorUnits(card.availableCents, card.currencyCode),
              }),
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
