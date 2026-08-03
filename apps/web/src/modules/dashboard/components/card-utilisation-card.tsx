import { useTranslate } from "@budget-manager/i18n/react";
import { WarningIcon } from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@budget-manager/ui/components/card";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { CardSlice } from "@budget-manager/client";

const NEAR_LIMIT_PERCENT = 80;

/**
 * A limit is a ratio against a ceiling, so each card gets a meter rather than a
 * bar in a chart. Severity rides the fill, and is spelled out in words beside
 * it — colour never carries the warning alone.
 */
export function CardUtilisationCard({
  cards,
  currencyCode,
}: {
  cards: CardSlice[];
  currencyCode: string;
}) {
  const t = useTranslate();
  const ranked = [...cards].sort(
    (a, b) => b.outstandingCents - a.outstandingCents,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.cards.title")}</CardTitle>
        <CardDescription>{t("dashboard.cards.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {ranked.map((item) => {
            const used =
              item.limitCents > 0
                ? Math.round((item.outstandingCents / item.limitCents) * 100)
                : 0;
            const overLimit = item.availableCents < 0;
            const nearLimit = !overLimit && used >= NEAR_LIMIT_PERCENT;

            return (
              <li key={item.id} className="space-y-1.5">
                <div className="flex flex-row items-baseline justify-between gap-4">
                  <span className="truncate">{item.name}</span>
                  <span className="shrink-0 tabular-nums">
                    {formatMinorUnits(item.outstandingCents, currencyCode)}
                    <span className="text-muted-foreground">
                      {" / "}
                      {formatMinorUnits(item.limitCents, currencyCode)}
                    </span>
                  </span>
                </div>

                <div
                  className="h-2.5 w-full overflow-hidden rounded-full bg-chart-track"
                  role="progressbar"
                  aria-label={t("dashboard.cards.limitUsed", {
                    name: item.name,
                  })}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(used, 100)}
                  aria-valuetext={t("dashboard.cards.percentOfLimit", {
                    percent: used,
                  })}
                >
                  <div
                    className={`h-full ${
                      overLimit
                        ? "bg-destructive"
                        : nearLimit
                          ? "bg-warning"
                          : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(Math.max(used, 0), 100)}%` }}
                  />
                </div>

                <p className="flex flex-row items-center gap-1 text-xs text-muted-foreground">
                  {(overLimit || nearLimit) && (
                    <WarningIcon
                      aria-hidden
                      className={
                        overLimit ? "text-destructive" : "text-warning"
                      }
                    />
                  )}
                  {overLimit
                    ? t("dashboard.cards.overLimit", {
                        amount: formatMinorUnits(
                          -item.availableCents,
                          currencyCode,
                        ),
                      })
                    : t("dashboard.cards.used", {
                        percent: used,
                        amount: formatMinorUnits(
                          item.availableCents,
                          currencyCode,
                        ),
                      })}
                </p>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
