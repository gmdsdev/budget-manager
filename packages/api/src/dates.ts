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
