import type { BudgetProgressRow } from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { BudgetStatus } from "@budget-manager/schemas";
import { View } from "react-native";

import { Meter } from "@/components/ui/meter";
import { Text } from "@/components/ui/text";
import { CategoryLabel } from "@/modules/category/components/category-label";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

/**
 * The bar is plain views rather than a chart mark: it carries a long category name
 * and its own value labels, which an SVG bar would clip. The fill is the category's
 * own ink, so the same hue means the same category here, in the ledger and in the
 * dashboard's spending breakdown — and the words beside it carry the *reading*, since
 * a pastel fill may never be the only signal.
 *
 * Shared by the budget screen and the dashboard widget, so one bar renders both.
 */
export function BudgetMeter({
  budget,
  action,
}: {
  budget: BudgetProgressRow;
  /** A row menu, when the meter is somewhere the limit can be edited. */
  action?: React.ReactNode;
}) {
  const t = useTranslate();
  const colors = useColors();
  const over = budget.remainingCents < 0;

  const fill = over ? colors.chartExpense : colors.category[budget.categoryColor];
  const settledRatio =
    budget.limitCents > 0 ? Math.max(0, budget.spentCents / budget.limitCents) : 0;

  return (
    <View style={{ gap: SPACING.xs }}>
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
            variant="small"
          />
        </View>
        <Text
          variant="small"
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
        <Text variant="tiny" tone="muted" style={{ fontVariant: ["tabular-nums"] }}>
          {t("budget.meter.spentOfLimit", {
            spent: formatMinorUnits(budget.projectedSpentCents, budget.currencyCode),
            limit: formatMinorUnits(budget.limitCents, budget.currencyCode),
          })}
        </Text>
        <View style={{ flexDirection: "row", gap: SPACING.sm }}>
          {budget.isOverride && (
            <Text variant="tiny" tone="muted">
              {t("budget.meter.overridden")}
            </Text>
          )}
          <Text
            variant="tiny"
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
