import { RecordGlyph, RecordList, RecordRow } from "@/components/record-row";
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
                <CreditCardIcon className="size-5" />
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
                <p
                  data-list-cell
                  className={`text-lg font-bold tracking-[-0.025em] tabular-nums ${
                    card.outstandingCents > 0 ? "text-destructive" : ""
                  }`}
                >
                  {formatMinorUnits(card.outstandingCents, card.currencyCode)}
                </p>
                {/* What is owed only means something against what is left. */}
                <p
                  data-list-cell
                  className={`text-xs tabular-nums ${
                    card.availableCents < 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {t("creditCard.column.availableValue", {
                    amount: formatMinorUnits(
                      card.availableCents,
                      card.currencyCode,
                    ),
                  })}
                </p>
                {hasPending ? (
                  <p
                    data-list-cell
                    className="text-xs text-muted-foreground tabular-nums"
                  >
                    {t("creditCard.projected", {
                      amount: formatMinorUnits(
                        card.projectedOutstandingCents,
                        card.currencyCode,
                      ),
                    })}
                  </p>
                ) : null}
              </>
            }
          />
        );
      })}
    </RecordList>
  );
}
