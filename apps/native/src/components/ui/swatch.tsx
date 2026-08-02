import { View } from "react-native";

import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH } from "@/theme/tokens";

/**
 * Square with an ink outline, which is what gives a pastel fill its contrast
 * relief. Decoration only: it always sits next to a name, so it carries no text
 * of its own and is hidden from assistive tech — twelve hues cannot all stay
 * separable under dichromacy, which is exactly why the label never leaves.
 *
 * `null` is not the same as absent: a row whose swatch is empty (an
 * uncategorized transaction) reads as a hollow ring, while a column with no
 * swatch at all renders none.
 */
export function Swatch({
  color,
  size = 10,
}: {
  color: string | null;
  size?: number;
}) {
  const colors = useColors();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        borderWidth: BORDER_WIDTH,
        borderColor: color ? colors.border : colors.mutedForeground,
        backgroundColor: color ?? "transparent",
      }}
    />
  );
}
