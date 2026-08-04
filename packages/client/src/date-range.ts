import type { MessageKey } from "@budget-manager/i18n";

/**
 * `yyyy-MM-dd` string arithmetic, kept dependency-free so both apps can read it —
 * the web's date picker and the native one have to agree with the transaction list
 * about what "this month" means, and a second copy of that answer is one too many.
 */
export type DateRangeValue = { from: string; to: string };

/**
 * Derived rather than written out: it stays the exact set of preset messages, and
 * because none of them takes a placeholder a picker can call `t` with the key alone.
 */
export type DateRangePresetKey = Extract<MessageKey, `dateRange.${string}`>;

export type DateRangePreset = {
  labelKey: DateRangePresetKey;
  getRange: (today?: Date) => DateRangeValue;
};

export function formatIsoDate(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Local midnight from a `yyyy-MM-dd` string. `new Date(value)` reads a date-only
 * string as **UTC** midnight, so every user west of UTC would see the previous day.
 */
export function parseIsoDate(value: string | null | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return undefined;
  }

  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Day 0 of the next month is the last day of this one, leap Februaries included. */
export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

/** Overflow is the constructor's problem: day 0 and day 32 both land correctly. */
export function addDays(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
}

/**
 * Sunday, which is where both shipped locales start a week — and, more to the
 * point, where both calendar grids draw one. A week range that disagreed with the
 * grid above it would highlight a row split across two of them.
 */
const WEEK_STARTS_ON = 0;

export function startOfWeek(date: Date) {
  const shift = (date.getDay() - WEEK_STARTS_ON + 7) % 7;

  return addDays(date, -shift);
}

function range(from: Date, to: Date): DateRangeValue {
  return { from: formatIsoDate(from), to: formatIsoDate(to) };
}

export function currentMonthRange(today = new Date()): DateRangeValue {
  return range(startOfMonth(today), endOfMonth(today));
}

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  {
    labelKey: "dateRange.thisMonth",
    getRange: (today = new Date()) => currentMonthRange(today),
  },
  {
    labelKey: "dateRange.lastMonth",
    getRange: (today = new Date()) => currentMonthRange(addMonths(today, -1)),
  },
  {
    labelKey: "dateRange.thisWeek",
    getRange: (today = new Date()) =>
      range(startOfWeek(today), addDays(startOfWeek(today), 6)),
  },
  {
    labelKey: "dateRange.lastWeek",
    getRange: (today = new Date()) =>
      range(addDays(startOfWeek(today), -7), addDays(startOfWeek(today), -1)),
  },
  {
    labelKey: "dateRange.today",
    getRange: (today = new Date()) => range(today, today),
  },
];

/**
 * The label of the sixth option, which is the one that sets no range: it marks a
 * range the presets cannot express, and picking it is how a reader says they are
 * about to draw one on the calendar. It carries no `getRange`, so it is not a
 * `DateRangePreset` and cannot be applied by accident.
 */
export const DATE_RANGE_CUSTOM_KEY: DateRangePresetKey = "dateRange.custom";

/** Inclusive, so a single day is 1 and `Today` steps by exactly that. */
function dayCount(from: Date, to: Date) {
  const DAY_MS = 86_400_000;

  // Rounded rather than floored: two local midnights are 23 or 25 hours apart
  // across a DST boundary, which is not a whole number of days.
  return Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
}

/**
 * How many whole calendar months the range covers, or `null` when it does not
 * cover them exactly. This is the one shape that must not step by its length in
 * days: a month is 28 to 31 of them, so `January` advanced by 31 days lands on
 * the 1st of February *and* the 3rd of March depending on the month it started in.
 */
function wholeMonthSpan(from: Date, to: Date) {
  const endsOnLastDay =
    to.getDate() === endOfMonth(to).getDate() && from.getDate() === 1;

  if (!endsOnLastDay) {
    return null;
  }

  const months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) +
    1;

  return months > 0 ? months : null;
}

/**
 * One click of the stepper beside the range: the *same* period, moved. What a
 * period is comes from the range itself rather than from a remembered preset —
 * whole calendar months move by months, everything else by its own length in days
 * — so a range stepped once keeps stepping the same way, and a hand-drawn 13-day
 * range advances 13 days without anyone having to declare that it is 13 days long.
 */
export function shiftDateRange(
  value: DateRangeValue,
  direction: 1 | -1,
): DateRangeValue {
  const from = parseIsoDate(value.from);
  const to = parseIsoDate(value.to);

  if (!from || !to) {
    return value;
  }

  const months = wholeMonthSpan(from, to);

  if (months) {
    const start = addMonths(from, months * direction);

    return range(start, endOfMonth(addMonths(start, months - 1)));
  }

  const step = dayCount(from, to) * direction;

  return range(addDays(from, step), addDays(to, step));
}

/**
 * Whether the range is one calendar month, which a trigger can then name rather
 * than recite: `2026-08-01 – 2026-08-31` is the period a reader calls *August*.
 * More than one whole month is deliberately not included — `Jan 1 – Mar 31` says
 * more than any single month's name could.
 */
export function isWholeMonthRange(value: DateRangeValue) {
  const from = parseIsoDate(value.from);
  const to = parseIsoDate(value.to);

  return from && to ? wholeMonthSpan(from, to) === 1 : false;
}

/**
 * Today as the string every schema, form and tRPC input carries. Every create form
 * defaults its date to this, so anything just recorded lands inside the ledger's
 * default view.
 */
export function todayAsDateString() {
  return formatIsoDate(new Date());
}
