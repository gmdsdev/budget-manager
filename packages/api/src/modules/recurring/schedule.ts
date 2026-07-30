import { RECURRENCE_YEARS, RecurrenceType } from "@budget-manager/schemas";
import { formatDate, parseDateString, shiftMonths } from "../../dates";

/** How far ahead a non-finite series is materialized. */
export const HORIZON_MONTHS = 12;

/** Backstop so a tiny interval cannot generate an unbounded series. */
export const MAX_OCCURRENCES = 400;

function lastDayOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * The nth step from an anchor date.
 *
 * Monthly and yearly steps keep the anchor's day-of-month and **clamp** to the
 * end of a short month, so a series anchored on the 31st runs 31 Jan → 28 Feb →
 * 31 Mar rather than drifting earlier every month. `Date` would otherwise roll
 * 31 Feb forward into March.
 */
function step(anchor: Date, type: RecurrenceType, interval: number, n: number) {
  if (type === RecurrenceType.WEEKLY) {
    return new Date(
      anchor.getFullYear(),
      anchor.getMonth(),
      anchor.getDate() + n * interval * 7,
    );
  }

  const monthsPerStep = type === RecurrenceType.YEARLY ? 12 * interval : interval;
  const target = shiftMonths(new Date(anchor.getFullYear(), anchor.getMonth(), 1), n * monthsPerStep);
  const day = Math.min(
    anchor.getDate(),
    lastDayOfMonth(target.getFullYear(), target.getMonth()),
  );

  return new Date(target.getFullYear(), target.getMonth(), day);
}

/**
 * Where an open-ended series stops. Nobody is asked for an end date, so it is
 * derived from the start and stored, keeping the rule row a complete record of
 * the schedule.
 */
export function seriesEndsOn(startsOn: string): string {
  return formatDate(
    step(parseDateString(startsOn), RecurrenceType.YEARLY, RECURRENCE_YEARS, 1),
  );
}

/**
 * Every date a rule should produce, in order.
 *
 * `fixed` means a set number of monthly installments — exactly `installments`
 * dates, ignoring `endsOn` and the horizon, which is what makes a 12× purchase
 * land as 12 rows. Open-ended types run until `endsOn` (inclusive) or the
 * horizon, whichever comes first.
 */
export function occurrenceDates({
  recurrenceType,
  interval,
  installments,
  startsOn,
  endsOn,
  today,
}: {
  recurrenceType: RecurrenceType;
  interval: number;
  installments: number | null;
  startsOn: string;
  endsOn: string | null;
  today: string;
}): string[] {
  if (interval < 1) {
    throw new Error(`Interval must be at least 1, received ${interval}`);
  }

  const anchor = parseDateString(startsOn);

  if (recurrenceType === RecurrenceType.FIXED) {
    if (!installments || installments < 1) {
      throw new Error("A fixed schedule needs at least one installment");
    }

    const count = Math.min(installments, MAX_OCCURRENCES);

    return Array.from({ length: count }, (_, index) =>
      formatDate(step(anchor, recurrenceType, interval, index)),
    );
  }

  const horizon = formatDate(shiftMonths(parseDateString(today), HORIZON_MONTHS));
  const limit = endsOn && endsOn < horizon ? endsOn : horizon;
  const dates: string[] = [];

  for (let index = 0; index < MAX_OCCURRENCES; index++) {
    const date = formatDate(step(anchor, recurrenceType, interval, index));

    if (date > limit) {
      break;
    }

    dates.push(date);
  }

  return dates;
}
