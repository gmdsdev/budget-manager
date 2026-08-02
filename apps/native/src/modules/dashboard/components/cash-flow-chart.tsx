import type { MonthPoint } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { formatCompactMinorUnits, formatMinorUnits } from "@budget-manager/money";
import { View } from "react-native";

import { Card, CardHeader } from "@/components/ui/card";
import { Swatch } from "@/components/ui/swatch";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, SPACING } from "@/theme/tokens";

const BAR_AREA_HEIGHT = 120;

/**
 * Income against spending, month by month, as a pair of plain views per month rather
 * than an SVG chart: at phone width a recharts bar group is mostly axis, and the
 * values here have to stay legible without a hover.
 *
 * The rules the web's charts follow hold: one series, one colour; a legend whenever
 * there are two; income always on the left so position carries the reading as well as
 * hue; and every figure is also stated in words underneath, so no number is reachable
 * only by looking at a bar.
 */
export function CashFlowChart({
  trend,
  currencyCode,
}: {
  trend: MonthPoint[];
  currencyCode: string;
}) {
  const { t, formatMonthString } = useI18n();
  const colors = useColors();

  const hasMovement = trend.some(
    (point) => point.incomeCents !== 0 || point.expenseCents !== 0,
  );

  const ceiling = Math.max(
    1,
    ...trend.map((point) => Math.max(point.incomeCents, point.expenseCents)),
  );

  return (
    <Card>
      <CardHeader
        title={t("dashboard.cashFlow.title")}
        description={t("dashboard.cashFlow.description")}
      />

      {!hasMovement ? (
        <Text variant="tiny" tone="muted">
          {t("dashboard.cashFlow.empty")}
        </Text>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: SPACING.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs }}>
              <Swatch color={colors.chartIncome} size={8} />
              <Text variant="tiny" tone="muted">
                {t("dashboard.stat.income")}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs }}>
              <Swatch color={colors.chartExpense} size={8} />
              <Text variant="tiny" tone="muted">
                {t("dashboard.stat.expenses")}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              height: BAR_AREA_HEIGHT,
              gap: SPACING.sm,
              borderBottomWidth: BORDER_WIDTH,
              borderColor: colors.border,
            }}
          >
            {trend.map((point) => (
              <View
                key={point.month}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  gap: 2,
                  height: "100%",
                }}
              >
                <Bar
                  cents={point.incomeCents}
                  ceiling={ceiling}
                  color={colors.chartIncome}
                  border={colors.border}
                />
                <Bar
                  cents={point.expenseCents}
                  ceiling={ceiling}
                  color={colors.chartExpense}
                  border={colors.border}
                />
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: SPACING.sm }}>
            {trend.map((point) => (
              <Text
                key={point.month}
                variant="tiny"
                tone="muted"
                numberOfLines={1}
                style={{ flex: 1, textAlign: "center" }}
              >
                {formatMonthString(point.month, "monthShort")}
              </Text>
            ))}
          </View>

          {/* The chart's table twin: the compact axis form the web uses on its ticks
              keeps anything under a thousand exact, so a figure here is always one
              the user can find in the list below. */}
          <View style={{ gap: SPACING.xs }}>
            {trend.map((point) => (
              <View
                key={point.month}
                style={{ flexDirection: "row", gap: SPACING.sm, alignItems: "center" }}
              >
                <Text variant="tiny" tone="muted" style={{ flex: 1 }}>
                  {formatMonthString(point.month, "monthYear")}
                </Text>
                <Text variant="tiny" style={{ fontVariant: ["tabular-nums"] }}>
                  {formatCompactMinorUnits(point.incomeCents, currencyCode)}
                </Text>
                <Text variant="tiny" style={{ fontVariant: ["tabular-nums"] }}>
                  {formatCompactMinorUnits(point.expenseCents, currencyCode)}
                </Text>
                <Text
                  variant="tiny"
                  tone={point.netCents < 0 ? "destructive" : "default"}
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {t("dashboard.cashFlow.net", {
                    amount: formatMinorUnits(point.netCents, currencyCode),
                  })}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
}

function Bar({
  cents,
  ceiling,
  color,
  border,
}: {
  cents: number;
  ceiling: number;
  color: string;
  border: string;
}) {
  // A month with nothing in it still draws a hairline, so an empty column reads as
  // zero rather than as missing.
  const height = Math.max(1, (Math.max(0, cents) / ceiling) * BAR_AREA_HEIGHT);

  return (
    <View
      style={{
        flex: 1,
        maxWidth: 14,
        height,
        backgroundColor: color,
        borderWidth: BORDER_WIDTH,
        borderColor: border,
      }}
    />
  );
}
