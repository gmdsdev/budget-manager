import { addDays, formatDate, parseDateString, shiftMonths } from "../../dates";

export type BillCycle = {
  /** First day the statement covers. */
  periodStart: string;
  /** Last day the statement covers; the same date it closes. */
  periodEnd: string;
  closeAt: string;
  dueAt: string;
};

export type BillStatus = "open" | "awaiting_payment" | "paid";

/**
 * Which statement a purchase lands on.
 *
 * A statement closes on `closeDay`. Anything bought after that day belongs to
 * the *next* statement, and a purchase made exactly on the closing day still
 * makes it onto the one closing that day. The period runs from the day after
 * the previous close through the close itself.
 *
 * The due date is in the same month as the close when `dueDay` is later in the
 * month than `closeDay`, and in the following month otherwise — which is also
 * how a card behaves when they are equal.
 *
 * Cycle days are capped at 1–28 (`CYCLE_DAY_MAX`), so no month is ever too
 * short for the requested day.
 */
export function cycleFor({
  date,
  closeDay,
  dueDay,
}: {
  date: string;
  closeDay: number;
  dueDay: number;
}): BillCycle {
  const occurred = parseDateString(date);

  const closeAt =
    occurred.getDate() <= closeDay
      ? new Date(occurred.getFullYear(), occurred.getMonth(), closeDay)
      : new Date(occurred.getFullYear(), occurred.getMonth() + 1, closeDay);

  const periodStart = addDays(shiftMonths(closeAt, -1), 1);

  const dueAt =
    dueDay > closeDay
      ? new Date(closeAt.getFullYear(), closeAt.getMonth(), dueDay)
      : new Date(closeAt.getFullYear(), closeAt.getMonth() + 1, dueDay);

  return {
    periodStart: formatDate(periodStart),
    periodEnd: formatDate(closeAt),
    closeAt: formatDate(closeAt),
    dueAt: formatDate(dueAt),
  };
}

/**
 * Derived rather than stored: a bill closes simply by the date passing, so
 * there is nothing to schedule and the status can never be stale.
 */
export function deriveBillStatus({
  closeAt,
  statementTotalCents,
  paidCents,
  today,
}: {
  closeAt: string;
  statementTotalCents: number;
  paidCents: number;
  today: string;
}): BillStatus {
  // Only a statement with something on it can be settled.
  if (statementTotalCents > 0 && paidCents >= statementTotalCents) {
    return "paid";
  }

  return today > closeAt ? "awaiting_payment" : "open";
}
