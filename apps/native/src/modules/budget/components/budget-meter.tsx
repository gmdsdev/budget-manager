import type { BudgetProgressRow } from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { BudgetStatus } from "@budget-manager/schemas";
import { View } from "react-native";

import { Meter } from "@/components/ui/meter";
import { Text } from "@/components/ui/text";
import { CategoryLabel } from "@/modules/category/components/category-label";
import { useColors } from "@/theme/theme-provider";
import { SPACING, type ThemeColors } from "@/theme/tokens";

/**
 * The bar is plain views rather than a chart mark: it carries a long category name
 * and its own value labels, which an SVG bar would clip.
 *
 * **The fill states the reading, not the category** — green on track, yellow close
 * to the limit, red overspent. A budget meter is answering "am I fine here", so a
 * bar tinted by category identity said nothing about the one thing it exists to
 * report. The category's own ink still leads the row, in the swatch next to its
 * name, so the hue-means-category rule holds where identity is what is shown.
 *
 * Shared by the budget screen and the dashboard widget, so one bar renders both.
 */
function statusFill(colors: ThemeColors, status: BudgetStatus) {
  if (status === BudgetStatus.EXCEEDED) return colors.destructive;
  if (status === BudgetStatus.WARNING) return colors.warningMark;

  return colors.primary;
}

export function BudgetMeter({
  budget,
  action,
}: {
  budget: BudgetProgressRow;
  /** The month card's own actions, when the limit can be edited from here. */
  action?: React.ReactNode;
}) {
  const t = useTranslate();
  const colors = useColors();
  const over = budget.remainingCents < 0;

  const fill = statusFill(colors, budget.status);
  const settledRatio =
    budget.limitCents > 0 ? Math.max(0, budget.spentCents / budget.limitCents) : 0;

  return (
    <View style={{ gap: SPACING.sm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.sm,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <CategoryLabel
            color={budget.categoryColor}
            name={budget.categoryName}
            variant="metaMedium"
          />
        </View>
        <Text
          variant="meta"
          tone={over ? "destructive" : "default"}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {over
            ? t("budget.meter.over", {
                amount: formatMinorUnits(
                  Math.abs(budget.remainingCents),
                  budget.currencyCode,
                ),
              })
            : t("budget.meter.remaining", {
                amount: formatMinorUnits(budget.remainingCents, budget.currencyCode),
              })}
        </Text>
        {action}
      </View>

      {/* Two segments, not two bars: what is already paid reads solid and the rest
          of the commitment reads faded, inside one track. */}
      <Meter
        segments={[
          { ratio: Math.min(settledRatio, budget.usedRatio), color: fill },
          {
            ratio: Math.max(0, budget.usedRatio - settledRatio),
            color: fill,
            faded: true,
          },
        ]}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: SPACING.sm,
        }}
      >
        <Text variant="meta" tone="muted" style={{ fontVariant: ["tabular-nums"] }}>
          {t("budget.meter.spentOfLimit", {
            spent: formatMinorUnits(budget.projectedSpentCents, budget.currencyCode),
            limit: formatMinorUnits(budget.limitCents, budget.currencyCode),
          })}
        </Text>
        <View style={{ flexDirection: "row", gap: SPACING.sm }}>
          {budget.isOverride && (
            <Text variant="meta" tone="muted">
              {t("budget.meter.overridden")}
            </Text>
          )}
          <Text
            variant="meta"
            tone={
              budget.status === BudgetStatus.EXCEEDED
                ? "destructive"
                : budget.status === BudgetStatus.WARNING
                  ? "warning"
                  : "muted"
            }
          >
            {t(`enum.budgetStatus.${budget.status}`)}
          </Text>
        </View>
      </View>
    </View>
  );
}
