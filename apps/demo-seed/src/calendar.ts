import { formatDate } from "@budget-manager/api/dates";
import { TransactionStatus } from "@budget-manager/schemas";

function lastDayOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Dates are relative to the run, never hard-coded: a demo account seeded today
 * has to read as "the last year" whenever it is opened.
 */
export function createCalendar(now = new Date()) {
  const today = formatDate(now);

  /** `YYYY-MM-DD` for a day in the month `monthOffset` away, clamped short. */
  const dayIn = (monthOffset: number, day: number) => {
    const month = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const clamped = Math.min(
      day,
      lastDayOfMonth(month.getFullYear(), month.getMonth()),
    );

    return formatDate(
      new Date(month.getFullYear(), month.getMonth(), clamped),
    );
  };

  const monthKey = (monthOffset: number) => dayIn(monthOffset, 1).slice(0, 7);

  const isFuture = (date: string) => date > today;

  return {
    today,
    dayIn,
    monthKey,
    isFuture,
    /**
     * The one rule for every row this script writes: what already happened is
     * settled, what has not is still waiting. Nothing else needs to decide.
     */
    statusFor: (date: string) =>
      isFuture(date)
        ? TransactionStatus.WAITING_PAYMENT
        : TransactionStatus.PAID,
    /** Every month offset from `-past` through `+future`, oldest first. */
    monthOffsets: (past: number, future: number) =>
      Array.from({ length: past + future + 1 }, (_, index) => index - past),
  };
}

export type Calendar = ReturnType<typeof createCalendar>;
