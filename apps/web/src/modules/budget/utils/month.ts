/**
 * `yyyy-MM` key arithmetic only. Turning a key into words is
 * `useI18n().formatMonthString`, so a month reads in the app's language rather
 * than the browser's.
 */
export function currentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}`;
}

export function shiftMonth(month: string, delta: number) {
  const [year, index] = month.split("-");
  const date = new Date(Number(year), Number(index) - 1 + delta, 1);

  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

export function monthParts(month: string) {
  const [year, index] = month.split("-");

  return { year: Number(year), monthIndex: Number(index) - 1 };
}

export function toMonthKey(year: number, monthIndex: number) {
  return `${year}-${`${monthIndex + 1}`.padStart(2, "0")}`;
}
