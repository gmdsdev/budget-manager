import type { MonthPoint } from "@budget-manager/client";
import { View } from "react-native";
import Svg, { Line, Polyline } from "react-native-svg";

import { useColors } from "@/theme/theme-provider";

const HEIGHT = 36;
const WIDTH = 100;

/**
 * The last months of net, as context for the figure beside it. No axes and no
 * tooltip: the same numbers are labelled in the cash-flow chart's table twin, so
 * nothing here is reachable only by looking closely.
 */
export function NetSparkline({
  trend,
  label,
}: {
  trend: MonthPoint[];
  label: string;
}) {
  const colors = useColors();

  if (trend.length < 2) {
    return null;
  }

  const values = trend.map((point) => point.netCents);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = max - min || 1;

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * WIDTH;
      const y = HEIGHT - ((value - min) / span) * HEIGHT;

      return `${x},${y}`;
    })
    .join(" ");

  const zeroY = HEIGHT - ((0 - min) / span) * HEIGHT;

  return (
    <View accessibilityRole="image" accessibilityLabel={label} style={{ height: HEIGHT }}>
      <Svg
        width="100%"
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
      >
        {/* The baseline is a hairline solid rule, never dashed. */}
        <Line x1={0} y1={zeroY} x2={WIDTH} y2={zeroY} stroke={colors.border} strokeWidth={1} />
        <Polyline
          points={points}
          fill="none"
          stroke={colors.mutedForeground}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
