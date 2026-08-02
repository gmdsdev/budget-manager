import { type BudgetRow, getErrorMessage } from "@budget-manager/client";
import { useBudgetPeriodsQuery } from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { View } from "react-native";

import { Plate } from "@/components/ui/plate";
import { Sheet } from "@/components/ui/sheet";
import { SkeletonList } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, SPACING } from "@/theme/tokens";

/** Every month a series has laid down, and whether each one still follows it. */
export function BudgetPeriodsSheet({
  budget,
  open,
  onOpenChange,
}: {
  budget: BudgetRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, formatMonthString } = useI18n();
  const colors = useColors();
  const { data, isPending, isError, error } = useBudgetPeriodsQuery(
    open ? budget.id : null,
  );

  return (
    <Sheet
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("budget.periods.title", { name: budget.categoryName })}
      description={t("budget.periods.description")}
    >
      {isPending ? (
        <SkeletonList label={t("budget.periods.loading")} count={3} height={48} />
      ) : isError ? (
        <Text tone="destructive">{getErrorMessage(error)}</Text>
      ) : data.rows.length === 0 ? (
        <Text variant="small" tone="muted">
          {t("budget.periods.empty")}
        </Text>
      ) : (
        <Plate shadow="none">
          {data.rows.map((period, index) => (
            <View
              key={period.periodId}
              style={{
                padding: SPACING.md,
                gap: 2,
                borderTopWidth: index > 0 ? BORDER_WIDTH : 0,
                borderColor: colors.muted,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: SPACING.sm,
                }}
              >
                <Text variant="bodyMedium">
                  {formatMonthString(period.periodMonth, "monthYear")}
                </Text>
                <Text variant="body" style={{ fontVariant: ["tabular-nums"] }}>
                  {formatMinorUnits(period.limitCents, period.currencyCode)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: SPACING.sm,
                }}
              >
                <Text variant="tiny" tone="muted">
                  {t("budget.column.spent")}{" "}
                  {formatMinorUnits(period.projectedSpentCents, period.currencyCode)}
                </Text>
                <Text variant="tiny" tone="muted">
                  {period.isOverride
                    ? t("budget.periods.custom")
                    : t("budget.periods.inherited")}
                </Text>
              </View>
            </View>
          ))}
        </Plate>
      )}
    </Sheet>
  );
}
