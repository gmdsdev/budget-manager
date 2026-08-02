import { View } from "react-native";

import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH } from "@/theme/tokens";

export type MeterSegment = { ratio: number; color: string; faded?: boolean };

/**
 * Plain views rather than a chart mark: these bars carry long category names and
 * their own value labels, which an SVG bar would clip. The track is what carries
 * the reading — a pastel fill may never be the only way to read a value, so every
 * caller pairs the bar with a figure in words.
 *
 * Segments are clamped to the track: an overspent budget fills it rather than
 * overflowing, and the figure beside it is what states by how much.
 */
export function Meter({
  segments,
  height = 10,
  label,
  valueText,
}: {
  segments: MeterSegment[];
  height?: number;
  label?: string;
  valueText?: string;
}) {
  const colors = useColors();

  // Each segment takes what is left of the track, so the fills add up to it rather
  // than overflowing: an overspent budget fills the bar and the figure beside it is
  // what states by how much.
  const widths = segments.reduce<number[]>((taken, segment) => {
    const remaining = 100 - taken.reduce((total, width) => total + width, 0);

    return [...taken, Math.max(0, Math.min(remaining, segment.ratio * 100))];
  }, []);

  return (
    <View
      accessibilityRole={label ? "progressbar" : "none"}
      accessibilityLabel={label}
      accessibilityValue={valueText ? { text: valueText } : undefined}
      style={{
        height,
        flexDirection: "row",
        borderWidth: BORDER_WIDTH,
        borderColor: colors.border,
        backgroundColor: colors.chartTrack,
        overflow: "hidden",
      }}
    >
      {segments.map((segment, index) => (
        <View
          key={index}
          style={{
            width: `${widths[index] ?? 0}%`,
            height: "100%",
            backgroundColor: segment.color,
            opacity: segment.faded ? 0.5 : 1,
          }}
        />
      ))}
    </View>
  );
}
