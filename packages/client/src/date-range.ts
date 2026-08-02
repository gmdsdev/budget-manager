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
    labelKey: "dateRange.last3Months",
    getRange: (today = new Date()) =>
      range(startOfMonth(addMonths(today, -2)), endOfMonth(today)),
  },
  {
    labelKey: "dateRange.thisYear",
    getRange: (today = new Date()) =>
      range(
        new Date(today.getFullYear(), 0, 1),
        new Date(today.getFullYear(), 11, 31),
      ),
  },
  {
    labelKey: "dateRange.next12Months",
    getRange: (today = new Date()) =>
      range(startOfMonth(today), endOfMonth(addMonths(today, 11))),
  },
];

/**
 * Today as the string every schema, form and tRPC input carries. Every create form
 * defaults its date to this, so anything just recorded lands inside the ledger's
 * default view.
 */
export function todayAsDateString() {
  return formatIsoDate(new Date());
}
