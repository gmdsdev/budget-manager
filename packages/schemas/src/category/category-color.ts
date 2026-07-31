/**
 * The palette a category may be tinted with. Colour is picked from a fixed set
 * rather than typed as a hex value: the swatch, the table cell and the chart bar
 * all have to resolve to the same ink, and only a closed set can be mapped to
 * theme tokens that hold up in light and dark.
 *
 * Declaration order is the hue wheel, which is the order the picker renders.
 * Append to the end rather than re-ordering — a stored value is a category's
 * identity, so shifting what a slot means would recolour every existing row.
 */
export enum CategoryColor {
  BLUE = "blue",
  CYAN = "cyan",
  TEAL = "teal",
  GREEN = "green",
  LIME = "lime",
  YELLOW = "yellow",
  ORANGE = "orange",
  RED = "red",
  PINK = "pink",
  PURPLE = "purple",
  VIOLET = "violet",
  SLATE = "slate",
}

export const CATEGORY_COLORS = Object.values(CategoryColor);

export const DEFAULT_CATEGORY_COLOR = CategoryColor.BLUE;

export function isCategoryColor(value: string): value is CategoryColor {
  return CATEGORY_COLORS.includes(value as CategoryColor);
}
