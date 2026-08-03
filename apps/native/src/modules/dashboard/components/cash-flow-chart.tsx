import type { MonthPoint } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { View } from "react-native";

import { Card, CardHeader } from "@/components/ui/card";
import { Swatch } from "@/components/ui/swatch";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, RADIUS, SPACING } from "@/theme/tokens";

const BAR_AREA_HEIGHT = 120;

/**
 * Income against spending, month by month, as a pair of plain views per month rather
 * than an SVG chart: at phone width a recharts bar group is mostly axis, and the
 * values here have to stay legible without a hover.
 *
 * The rules the web's charts follow hold: one series, one colour; a legend whenever
 * there are two; income always on the left so position carries the reading as well as
 * hue; and no number is reachable only by looking at a bar — each month's column reads
 * its own figures out, which is what the web's `sr-only` table twin does there.
 *
 * Those figures used to be a *visible* table of four money columns under the bars.
 * That is a desktop shape: at phone width every row wrapped, so the one part of the
 * chart that existed to make the numbers legible was the least legible thing on the
 * screen.
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
        <Text variant="meta" tone="muted">
          {t("dashboard.cashFlow.empty")}
        </Text>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: SPACING.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs }}>
              <Swatch color={colors.chartIncome} size={8} />
              <Text variant="meta" tone="muted">
                {t("dashboard.stat.income")}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs }}>
              <Swatch color={colors.chartExpense} size={8} />
              <Text variant="meta" tone="muted">
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
                // The month's own figures, in words. This is the native reading of
                // the web's `sr-only` table twin — which is not visible there either,
                // so nothing is being taken away: no number is reachable only by
                // looking at a bar.
                accessible
                accessibilityLabel={t("dashboard.cashFlow.monthSummary", {
                  month: formatMonthString(point.month, "monthYear"),
                  income: formatMinorUnits(point.incomeCents, currencyCode),
                  expenses: formatMinorUnits(point.expenseCents, currencyCode),
                  net: formatMinorUnits(point.netCents, currencyCode),
                })}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  gap: 2,
                  height: "100%",
                }}
              >
                {/* Income always on the left, so position carries the reading
                    as well as hue. */}
                <Bar
                  cents={point.incomeCents}
                  ceiling={ceiling}
                  color={colors.chartIncome}
                />
                <Bar
                  cents={point.expenseCents}
                  ceiling={ceiling}
                  color={colors.chartExpense}
                />
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: SPACING.sm }}>
            {trend.map((point) => (
              <Text
                key={point.month}
                variant="meta"
                tone="muted"
                numberOfLines={1}
                style={{ flex: 1, textAlign: "center" }}
              >
                {formatMonthString(point.month, "monthShort")}
              </Text>
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
}: {
  cents: number;
  ceiling: number;
  color: string;
}) {
  // A month with nothing in it still draws a sliver, so an empty column reads as
  // zero rather than as missing.
  const height = Math.max(2, (Math.max(0, cents) / ceiling) * BAR_AREA_HEIGHT);

  return (
    <View
      style={{
        flex: 1,
        maxWidth: 14,
        height,
        backgroundColor: color,
        borderTopLeftRadius: RADIUS.sm,
        borderTopRightRadius: RADIUS.sm,
      }}
    />
  );
}
