import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@budget-manager/ui/components/card";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { CategoryLabel } from "@/modules/category/components/category-dot";
import { categoryColorVarOrNeutral } from "@/modules/category/colors";
import type { CategorySpend } from "@budget-manager/client";

/**
 * Each bar wears its category's own colour, so the same hue means the same
 * category here, in the ledger and in every select. Length still carries the
 * amount — colour is identity, never magnitude.
 */
export function SpendingBreakdown({
  categories,
  currencyCode,
  monthLabel,
  expenseCents,
}: {
  categories: CategorySpend[];
  currencyCode: string;
  monthLabel: string;
  expenseCents: number;
}) {
  const t = useTranslate();
  const largest = categories[0]?.amountCents ?? 0;
  const ranked = categories.reduce((total, category) => total + category.amountCents, 0);
  const rest = expenseCents - ranked;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.spending.title")}</CardTitle>
        <CardDescription>
          {t("dashboard.spending.description", { month: monthLabel })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("dashboard.spending.empty")}
          </p>
        ) : (
          <ul className="space-y-3">
            {categories.map((category) => {
              const share =
                expenseCents > 0
                  ? Math.round((category.amountCents / expenseCents) * 100)
                  : 0;
              // Bars are scaled against the largest one, so the top row always
              // fills the track and the rest read as a share of it.
              const width =
                largest > 0 ? (category.amountCents / largest) * 100 : 0;

              return (
                <li
                  key={category.categoryId ?? "uncategorized"}
                  className="space-y-1.5"
                >
                  <div className="flex flex-row items-baseline justify-between gap-4">
                    <CategoryLabel
                      color={category.color}
                      // The bucket with no category has no name to return, so
                      // the API's placeholder is a UI word the server cannot
                      // localize. The client owns that one label.
                      name={
                        category.categoryId
                          ? category.name
                          : t("category.uncategorized")
                      }
                    />
                    <span className="shrink-0 tabular-nums">
                      {formatMinorUnits(category.amountCents, currencyCode)}
                      <span className="ml-2 text-muted-foreground">
                        {share}%
                      </span>
                    </span>
                  </div>
                  <div
                    className="h-2.5 w-full border border-border bg-chart-track/40"
                    role="presentation"
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${width}%`,
                        backgroundColor: categoryColorVarOrNeutral(
                          category.color,
                        ),
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      {rest > 0 && (
        <CardContent className="text-xs text-muted-foreground">
          {t("dashboard.spending.rest", {
            amount: formatMinorUnits(rest, currencyCode),
          })}
        </CardContent>
      )}
    </Card>
  );
}
