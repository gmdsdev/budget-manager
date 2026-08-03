import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@budget-manager/ui/components/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@budget-manager/ui/components/chart";
import {
  formatCompactMinorUnits,
  formatMinorUnits,
} from "@budget-manager/ui/lib/currency";
import { useI18n } from "@budget-manager/i18n/react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { MonthPoint } from "@budget-manager/client";
import { ChartDataTable } from "./chart-data-table";

export function CashFlowChart({
  trend,
  currencyCode,
}: {
  trend: MonthPoint[];
  currencyCode: string;
}) {
  const { t, formatMonthString } = useI18n();

  // Rebuilt per render rather than a module constant: the series names are what
  // the legend and the tooltip print.
  const chartConfig = {
    income: { label: t("dashboard.stat.income"), color: "var(--chart-income)" },
    expense: {
      label: t("dashboard.stat.expenses"),
      color: "var(--chart-expense)",
    },
  } satisfies ChartConfig;

  const data = trend.map((point) => ({
    month: point.month,
    label: formatMonthString(point.month, "monthShort"),
    income: point.incomeCents,
    expense: point.expenseCents,
    net: point.netCents,
  }));

  const hasMovement = data.some(
    (point) => point.income !== 0 || point.expense !== 0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.cashFlow.title")}</CardTitle>
        <CardDescription>{t("dashboard.cashFlow.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasMovement ? (
          <>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-80 w-full"
            >
              <BarChart
                accessibilityLayer
                data={data}
                barGap={2}
                barCategoryGap="28%"
                margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <XAxis
                  dataKey="label"
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                {/* The gutter has to hold a compacted tick, so it keeps a
                    fixed width even on a phone: a narrower one clips the label
                    rather than saving space. 76px is sized to the longest form
                    across the shipped locales ("R$ 1,8 mil"), not to the
                    English one. */}
                <YAxis
                  width={76}
                  tickCount={4}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) =>
                    formatCompactMinorUnits(value, currencyCode)
                  }
                  className="tabular-nums"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_label, payload) => {
                        const point = payload?.[0]?.payload as
                          | (typeof data)[number]
                          | undefined;

                        if (!point) return null;

                        return (
                          <div className="space-y-0.5">
                            <p>{formatMonthString(point.month, "monthYear")}</p>
                            <p className="font-normal text-muted-foreground">
                              {t("dashboard.cashFlow.net", {
                                amount: formatMinorUnits(
                                  point.net,
                                  currencyCode,
                                ),
                              })}
                            </p>
                          </div>
                        );
                      }}
                      formatter={(value, name, item) => (
                        <div className="flex w-full items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-sm"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-muted-foreground">
                            {chartConfig[name as keyof typeof chartConfig]
                              ?.label ?? name}
                          </span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">
                            {formatMinorUnits(Number(value), currencyCode)}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                {/* Legend order follows the bars, not recharts' own sort. */}
                <ChartLegend
                  content={<ChartLegendContent />}
                  itemSorter={(item) => (item.dataKey === "income" ? 0 : 1)}
                />
                <Bar
                  dataKey="income"
                  fill="var(--color-income)"
                  maxBarSize={20}
                  radius={[6, 6, 2, 2]}
                />
                <Bar
                  dataKey="expense"
                  fill="var(--color-expense)"
                  maxBarSize={20}
                  radius={[6, 6, 2, 2]}
                />
              </BarChart>
            </ChartContainer>

            <ChartDataTable
              caption={t("dashboard.cashFlow.tableCaption", {
                currency: currencyCode,
              })}
              columns={[
                t("dashboard.cashFlow.month"),
                t("dashboard.stat.income"),
                t("dashboard.stat.expenses"),
                t("dashboard.stat.net"),
              ]}
              rows={data.map((point) => [
                formatMonthString(point.month, "monthYear"),
                formatMinorUnits(point.income, currencyCode),
                formatMinorUnits(point.expense, currencyCode),
                formatMinorUnits(point.net, currencyCode),
              ])}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.cashFlow.empty")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
