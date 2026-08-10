import {
  useCreditCardsQuery,
  useEnumLabels,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";

import { CreateCreditCardDialog } from "@/modules/credit-card/components/create-credit-card-dialog";

export function OnboardingCardsStep() {
  const t = useTranslate();
  const labels = useEnumLabels();
  const cardsQuery = useCreditCardsQuery();
  const cards = cardsQuery.data?.rows ?? [];

  return (
    <div className="flex flex-col gap-4">
      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("onboarding.cards.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border">
          {cards.map((card) => (
            <li
              key={card.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{card.name}</span>
                <span className="text-sm text-muted-foreground">
                  {labels.currency(card.currencyCode)}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">
                {formatMinorUnits(card.limitCents, card.currencyCode)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div>
        <CreateCreditCardDialog />
      </div>
    </div>
  );
}
