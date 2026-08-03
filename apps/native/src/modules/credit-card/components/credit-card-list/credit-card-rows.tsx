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
            meta={[
              card.currencyCode,
              t("creditCard.column.cycleValue", {
                closeDay: card.closeDay,
                dueDay: card.dueDay,
              }),
              card.defaultBillingWalletName ?? t("common.none"),
              // What is owed only means something against what may be: the
              // trailing figure is the outstanding, so the limit rides here.
              t("creditCard.column.limitValue", {
                amount: formatMinorUnits(card.limitCents, card.currencyCode),
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
                {/* What is owed only means something against what is left. */}
                <Text
                  variant="meta"
                  tone={card.availableCents < 0 ? "destructive" : "muted"}
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {t("creditCard.column.availableValue", {
                    amount: formatMinorUnits(
                      card.availableCents,
                      card.currencyCode,
                    ),
                  })}
                </Text>
                {hasPending ? (
                  <Text
                    variant="meta"
                    tone="muted"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {t("creditCard.projected", {
                      amount: formatMinorUnits(
                        card.projectedOutstandingCents,
                        card.currencyCode,
                      ),
                    })}
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
