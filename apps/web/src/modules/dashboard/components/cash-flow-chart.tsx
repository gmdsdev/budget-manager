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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { MonthPoint } from "../types";
import { formatMonthLabel, formatMonthShortLabel } from "../utils/month";
import { ChartDataTable } from "./chart-data-table";

const chartConfig = {
  income: { label: "Income", color: "var(--chart-income)" },
  expense: { label: "Expenses", color: "var(--chart-expense)" },
} satisfies ChartConfig;

export function CashFlowChart({
  trend,
  currencyCode,
}: {
  trend: MonthPoint[];
  currencyCode: string;
}) {
  const data = trend.map((point) => ({
    month: point.month,
    label: formatMonthShortLabel(point.month),
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
        <CardTitle>Cash flow</CardTitle>
        <CardDescription>
          Income against spending, month by month. Transfers are left out — they
          move money without earning or spending it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasMovement ? (
          <>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-56 w-full"
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
                <YAxis
                  width={64}
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
                            <p>{formatMonthLabel(point.month)}</p>
                            <p className="font-normal text-muted-foreground">
                              Net {formatMinorUnits(point.net, currencyCode)}
                            </p>
                          </div>
                        );
                      }}
                      formatter={(value, name, item) => (
                        <div className="flex w-full items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0"
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
                  maxBarSize={24}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  fill="var(--color-expense)"
                  maxBarSize={24}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>

            <ChartDataTable
              caption={`Income, spending and net per month, in ${currencyCode}`}
              columns={["Month", "Income", "Expenses", "Net"]}
              rows={data.map((point) => [
                formatMonthLabel(point.month),
                formatMinorUnits(point.income, currencyCode),
                formatMinorUnits(point.expense, currencyCode),
                formatMinorUnits(point.net, currencyCode),
              ])}
            />
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nothing recorded in these six months yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
