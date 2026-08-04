import type { Locale } from "./locale";

/**
 * The date shapes the app renders. Named rather than passed as options at each
 * call site: a `{ month: "short" }` written out four times drifts into four
 * slightly different dates on screen, and only a closed set can be checked.
 */
export const DATE_STYLES = {
  /** `31/07/2026` — dense, for a table cell that repeats on every row. */
  numeric: { day: "2-digit", month: "2-digit", year: "numeric" },
  /** `31 Jul 2026` — for a single date the reader has to actually parse. */
  day: { day: "numeric", month: "short", year: "numeric" },
  /** `31 Jul` — the year is context. */
  dayShort: { day: "numeric", month: "short" },
  /** `July 2026` — a month heading. */
  monthYear: { month: "long", year: "numeric" },
  /** `Jul` — an axis tick, where the year is the chart's own scope. */
  monthShort: { month: "short" },
  /** `Jul 31` — a due date in a list already scoped to a year. */
  monthDay: { month: "short", day: "numeric" },
  /**
   * `Jul 31, 14:05` — when a *reading* was taken, not when something is due. The
   * day is carried alongside the clock because the reader cannot tell a snapshot
   * five minutes old from one five days old by the time alone.
   */
  dayTime: {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

export type DateStyle = keyof typeof DATE_STYLES;

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(locale: Locale, style: DateStyle) {
  const key = `${locale}|${style}`;
  let formatter = dateFormatterCache.get(key);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, DATE_STYLES[style]);
    dateFormatterCache.set(key, formatter);
  }

  return formatter;
}

export function formatDate(
  locale: Locale,
  date: Date,
  style: DateStyle,
): string {
  return getDateFormatter(locale, style).format(date);
}

/**
 * Builds a local-midnight `Date` from a `yyyy-MM-dd` string. `new Date(value)`
 * reads a date-only string as **UTC** midnight, so every user west of UTC sees
 * the previous day — the same trap `DatePicker` avoids with `parseISO`.
 * Returns `null` for anything that is not a date, so a caller can echo the raw
 * value rather than render `Invalid Date`.
 */
export function parseDateString(value: string): Date | null {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats a `yyyy-MM-dd` string, echoing anything that is not one. */
export function formatDateString(
  locale: Locale,
  value: string,
  style: DateStyle,
): string {
  const date = parseDateString(value);

  return date ? formatDate(locale, date, style) : value;
}

const dateRangeFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateRangeFormatter(locale: Locale, style: DateStyle) {
  const key = `${locale}|${style}`;
  let formatter = dateRangeFormatterCache.get(key);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, DATE_STYLES[style]);
    dateRangeFormatterCache.set(key, formatter);
  }

  return formatter;
}

/**
 * A pair of dates as one phrase, with whatever the two ends share stated once:
 * `Aug 2 – 8, 2026`, `2 – 8 de ago. de 2026`. Two `formatDate` calls joined by a
 * dash cannot do that in two languages — the day sits before the month in one and
 * after it in the other — and the collapsed form is what keeps a range legible in
 * a control narrow enough to hold the stepper arrows beside it. Two ends on the
 * same day come back as that one day.
 */
export function formatDateRange(
  locale: Locale,
  from: Date,
  to: Date,
  style: DateStyle,
): string {
  return getDateRangeFormatter(locale, style).formatRange(from, to);
}

/** Formats a pair of `yyyy-MM-dd` strings, echoing anything that is not one. */
export function formatDateStringRange(
  locale: Locale,
  from: string,
  to: string,
  style: DateStyle,
): string {
  const start = parseDateString(from);
  const end = parseDateString(to);

  return start && end
    ? formatDateRange(locale, start, end, style)
    : `${from} – ${to}`;
}

/** Formats a `yyyy-MM` month key, echoing anything that is not one. */
export function formatMonthString(
  locale: Locale,
  value: string,
  style: DateStyle,
): string {
  const [year, month] = value.split("-");

  if (!year || !month) {
    return value;
  }

  return formatDate(locale, new Date(Number(year), Number(month) - 1, 1), style);
}
