/**
 * Select sentinel for "this column is empty" — an uncategorized transaction, a
 * card with no billing wallet. A `<Select>` value has to be a string, and an
 * empty one is indistinguishable from "no choice made yet".
 */
export const FILTER_NONE = "none";

export type FilterNone = typeof FILTER_NONE;

/**
 * Select sentinel for "not filtering on this column". A filter select always
 * holds a value, so the unset state needs one of its own; the trigger shows the
 * column name while it is set, which is what keeps the bar free of labels.
 */
export const FILTER_ALL = "all";

export type FilterAll = typeof FILTER_ALL;
