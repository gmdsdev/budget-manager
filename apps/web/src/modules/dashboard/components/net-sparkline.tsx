import {
  ChartContainer,
  type ChartConfig,
} from "@budget-manager/ui/components/chart";
import { Area, AreaChart, ReferenceLine, YAxis } from "recharts";
import type { MonthPoint } from "../types";

const chartConfig = {
  net: { label: "Net", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

/**
 * The last months of net, as context for the figure beside it. No axes and no
 * tooltip: the same numbers are labelled in the cash-flow chart's table.
 */
export function NetSparkline({
  trend,
  label,
}: {
  trend: MonthPoint[];
  label: string;
}) {
  const data = trend.map((point) => ({
    month: point.month,
    net: point.netCents,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-9 w-full"
      role="img"
      aria-label={label}
    >
      <AreaChart data={data} margin={{ top: 3, right: 2, bottom: 1, left: 2 }}>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
        <Area
          dataKey="net"
          type="monotone"
          stroke="var(--color-net)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="var(--color-net)"
          fillOpacity={0.1}
          dot={false}
          activeDot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
