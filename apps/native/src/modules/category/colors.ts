import type { CategoryColor } from "@budget-manager/schemas";

import type { ThemeColors } from "@/theme/tokens";

/**
 * A category owns a colour, and that colour is the same ink everywhere the
 * category appears. Resolved through the active palette rather than a static
 * lookup, because every hue carries a light and a dark step.
 */
export function categoryColor(colors: ThemeColors, color: CategoryColor) {
  return colors.category[color];
}

/**
 * A row with no category owns no colour, so it reads as ink rather than
 * borrowing a hue that belongs to a real category.
 */
export function categoryColorOrNeutral(
  colors: ThemeColors,
  color: CategoryColor | null,
) {
  return color ? colors.category[color] : colors.mutedForeground;
}
