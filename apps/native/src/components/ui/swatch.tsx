import { View } from "react-native";

import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, RADIUS } from "@/theme/tokens";

/**
 * A plain round fill. The ink outline that used to carry a pastel hue's contrast
 * relief is gone — the palette was re-saturated for the redesign and every step
 * now clears 3:1 against its own card surface. Decoration only: it always sits
 * next to a name, so it carries no text and is hidden from assistive tech —
 * twelve hues cannot all stay separable under dichromacy, which is exactly why
 * the label never leaves.
 *
 * `null` is not the same as absent: a row whose swatch is empty (an uncategorized
 * transaction) reads as a hollow ring, while a column with no swatch renders none.
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
        borderRadius: RADIUS.full,
        borderWidth: color ? 0 : BORDER_WIDTH,
        borderColor: colors.mutedForeground,
        backgroundColor: color ?? "transparent",
      }}
    />
  );
}
