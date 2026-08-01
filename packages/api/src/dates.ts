/** `YYYY-MM-DD` for a local date. */
export function formatDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseDateString(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match?.[1] || !match[2] || !match[3]) {
    throw new Error(`Expected a YYYY-MM-DD date, received "${value}"`);
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Same day-of-month in a month `offset` away, letting Date roll the year. */
export function shiftMonths(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** `YYYY-MM` for a local date. */
export function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

export function parseMonthKey(month: string): Date {
  const match = /^(\d{4})-(\d{2})$/.exec(month);

  if (!match?.[1] || !match[2]) {
    throw new Error(`Expected a YYYY-MM month, received "${month}"`);
  }

  const monthIndex = Number(match[2]) - 1;

  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error(`Month out of range in "${month}"`);
  }

  return new Date(Number(match[1]), monthIndex, 1);
}

export function shiftMonthKey(month: string, offset: number): string {
  const anchor = parseMonthKey(month);

  return monthKeyOf(
    new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1),
  );
}

/**
 * Inclusive first/last day of a `YYYY-MM` month. Day 0 of the *next* month is
 * the last day of this one, which keeps leap years and 30/31-day months right.
 */
export function monthDateRange(month: string): { from: string; to: string } {
  const anchor = parseMonthKey(month);

  return {
    from: formatDate(anchor),
    to: formatDate(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)),
  };
}
