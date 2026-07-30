import type { CategoryColor } from "@budget-manager/schemas";

/**
 * The palette is a token per slot, never a literal: a category's colour has to
 * resolve to the same ink in a table cell, a select row and a chart bar, and it
 * has to hold up in both themes. `globals.css` owns the steps.
 */
export function categoryColorVar(color: CategoryColor) {
  return `var(--category-${color})`;
}

/**
 * A row with no category owns no colour, so it reads as ink rather than
 * borrowing a hue that belongs to a real category.
 */
export const UNCATEGORIZED_COLOR_VAR = "var(--muted-foreground)";

export function categoryColorVarOrNeutral(color: CategoryColor | null) {
  return color ? categoryColorVar(color) : UNCATEGORIZED_COLOR_VAR;
}
