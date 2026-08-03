import type { CategorySpend } from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { View } from "react-native";

import { Card, CardHeader } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { Text } from "@/components/ui/text";
import { categoryColorOrNeutral } from "@/modules/category/colors";
import { CategoryLabel } from "@/modules/category/components/category-label";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

/**
 * Each bar wears its category's own colour, so the same hue means the same category
 * here, in the ledger and in every picker. Length still carries the amount — colour
 * is identity, never magnitude.
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
  const colors = useColors();
  const largest = categories[0]?.amountCents ?? 0;
  const ranked = categories.reduce((total, entry) => total + entry.amountCents, 0);
  const rest = expenseCents - ranked;

  return (
    <Card>
      <CardHeader
        title={t("dashboard.spending.title")}
        description={t("dashboard.spending.description", { month: monthLabel })}
      />

      {categories.length === 0 ? (
        <Text variant="meta" tone="muted">
          {t("dashboard.spending.empty")}
        </Text>
      ) : (
        <View style={{ gap: SPACING.md }}>
          {categories.map((category) => {
            const share =
              expenseCents > 0
                ? Math.round((category.amountCents / expenseCents) * 100)
                : 0;

            return (
              <View
                key={category.categoryId ?? "uncategorized"}
                style={{ gap: SPACING.xs }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: SPACING.sm,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <CategoryLabel
                      color={category.color}
                      // The bucket with no category has no name to return, so the
                      // API's placeholder is a UI word the server cannot localize.
                      name={
                        category.categoryId
                          ? category.name
                          : t("category.uncategorized")
                      }
                      variant="meta"
                    />
                  </View>
                  <Text variant="meta" style={{ fontVariant: ["tabular-nums"] }}>
                    {formatMinorUnits(category.amountCents, currencyCode)}
                  </Text>
                  <Text variant="meta" tone="muted">
                    {`${share}%`}
                  </Text>
                </View>

                {/* Bars are scaled against the largest one, so the top row always
                    fills the track and the rest read as a share of it. */}
                <Meter
                  segments={[
                    {
                      ratio: largest > 0 ? category.amountCents / largest : 0,
                      color: categoryColorOrNeutral(colors, category.color),
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      )}

      {rest > 0 && (
        <Text variant="meta" tone="muted">
          {t("dashboard.spending.rest", {
            amount: formatMinorUnits(rest, currencyCode),
          })}
        </Text>
      )}
    </Card>
  );
}
