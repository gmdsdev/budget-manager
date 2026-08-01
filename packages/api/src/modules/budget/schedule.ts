import {
  RECURRENCE_YEARS,
  RecurrenceType,
  type BudgetRecurrenceType,
} from "@budget-manager/schemas";
import { shiftMonthKey } from "../../dates";

/** How far ahead a non-finite budget is materialized. */
export const HORIZON_MONTHS = 12;

/** Backstop so a tiny interval cannot generate an unbounded series. */
export const MAX_PERIODS = 400;

/** Months per step. A budget period is a month, so every type is months. */
function monthsPerStep(type: BudgetRecurrenceType, interval: number) {
  return type === RecurrenceType.YEARLY ? 12 * interval : interval;
}

/**
 * Where an open-ended budget stops. Nobody is asked for an end month, so it is
 * derived from the start and stored, keeping the row a complete record of the
 * schedule. Fifty years is not fifty years of rows — the horizon below is still
 * what gets materialized.
 */
export function budgetEndsOn(startsOn: string): string {
  return shiftMonthKey(startsOn, 12 * RECURRENCE_YEARS);
}

/**
 * Every month a budget should cover, in order.
 *
 * `fixed` means a set number of periods — exactly `installments` months,
 * ignoring `endsOn` and the horizon, which is what lets a six-month challenge
 * land as six rows. The open-ended types run until `endsOn` (inclusive) or the
 * horizon, whichever comes first.
 */
export function budgetMonths({
  recurrenceType,
  interval,
  installments,
  startsOn,
  endsOn,
  today,
}: {
  recurrenceType: BudgetRecurrenceType;
  interval: number;
  installments: number | null;
  startsOn: string;
  endsOn: string | null;
  /** The `YYYY-MM` the horizon is measured from. */
  today: string;
}): string[] {
  if (interval < 1) {
    throw new Error(`Interval must be at least 1, received ${interval}`);
  }

  const step = monthsPerStep(recurrenceType, interval);

  if (recurrenceType === RecurrenceType.FIXED) {
    if (!installments || installments < 1) {
      throw new Error("A fixed budget needs at least one period");
    }

    const count = Math.min(installments, MAX_PERIODS);

    return Array.from({ length: count }, (_, index) =>
      shiftMonthKey(startsOn, index * step),
    );
  }

  const horizon = shiftMonthKey(today, HORIZON_MONTHS);
  const limit = endsOn && endsOn < horizon ? endsOn : horizon;
  const months: string[] = [];

  for (let index = 0; index < MAX_PERIODS; index += 1) {
    const month = shiftMonthKey(startsOn, index * step);

    if (month > limit) {
      break;
    }

    months.push(month);
  }

  return months;
}
