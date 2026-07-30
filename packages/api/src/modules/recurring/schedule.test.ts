import { RECURRENCE_YEARS, RecurrenceType } from "@budget-manager/schemas";
import { describe, expect, test } from "bun:test";

import {
  HORIZON_MONTHS,
  MAX_OCCURRENCES,
  occurrenceDates,
  seriesEndsOn,
} from "./schedule";

const TODAY = "2026-07-01";

function dates(over: Partial<Parameters<typeof occurrenceDates>[0]> = {}) {
  return occurrenceDates({
    recurrenceType: RecurrenceType.MONTHLY,
    interval: 1,
    installments: null,
    startsOn: "2026-07-05",
    endsOn: null,
    today: TODAY,
    ...over,
  });
}

describe("fixed installments", () => {
  test("produces exactly the requested count", () => {
    const result = dates({
      recurrenceType: RecurrenceType.FIXED,
      installments: 12,
      startsOn: "2026-07-05",
    });

    expect(result.length).toBe(12);
    expect(result[0]).toBe("2026-07-05");
    expect(result[11]).toBe("2027-06-05");
  });

  test("steps by the interval in months", () => {
    const result = dates({
      recurrenceType: RecurrenceType.FIXED,
      installments: 3,
      interval: 2,
      startsOn: "2026-01-10",
    });

    expect(result).toEqual(["2026-01-10", "2026-03-10", "2026-05-10"]);
  });

  test("runs past the horizon, because the count is what bounds it", () => {
    const result = dates({
      recurrenceType: RecurrenceType.FIXED,
      installments: 24,
    });

    // 24 monthly installments outlive a 12-month horizon by design.
    expect(result.length).toBe(24);
    expect(result[23]! > TODAY).toBe(true);
  });

  test("ignores an end date", () => {
    const result = dates({
      recurrenceType: RecurrenceType.FIXED,
      installments: 6,
      endsOn: "2026-08-01",
    });

    expect(result.length).toBe(6);
  });

  test("rejects a missing or zero count", () => {
    expect(() =>
      dates({ recurrenceType: RecurrenceType.FIXED, installments: null }),
    ).toThrow();
    expect(() =>
      dates({ recurrenceType: RecurrenceType.FIXED, installments: 0 }),
    ).toThrow();
  });

  test("caps a runaway count", () => {
    const result = dates({
      recurrenceType: RecurrenceType.FIXED,
      installments: 5_000,
    });

    expect(result.length).toBe(MAX_OCCURRENCES);
  });
});

describe("monthly", () => {
  test("starts on the start date and steps a month at a time", () => {
    const result = dates({ startsOn: "2026-07-05" });

    expect(result[0]).toBe("2026-07-05");
    expect(result[1]).toBe("2026-08-05");
  });

  test("stops at the horizon", () => {
    const result = dates({ startsOn: "2026-07-05" });

    // The horizon is 12 months from today (2027-07-01), so the step on
    // 2027-07-05 falls just outside it — 12 dates, not 13.
    expect(result.at(-1)).toBe("2027-06-05");
    expect(result.length).toBe(HORIZON_MONTHS);
  });

  test("stops at an end date before the horizon", () => {
    const result = dates({ startsOn: "2026-07-05", endsOn: "2026-10-05" });

    expect(result).toEqual([
      "2026-07-05",
      "2026-08-05",
      "2026-09-05",
      "2026-10-05",
    ]);
  });

  test("excludes an end date that falls between steps", () => {
    const result = dates({ startsOn: "2026-07-05", endsOn: "2026-09-04" });

    expect(result.at(-1)).toBe("2026-08-05");
  });

  test("clamps a 31st anchor into short months without drifting", () => {
    const result = dates({
      startsOn: "2026-01-31",
      endsOn: "2026-05-31",
      today: "2026-01-01",
    });

    // The anchor day is kept, not carried forward from February's clamp.
    expect(result).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
      "2026-05-31",
    ]);
  });

  test("clamps into a leap February", () => {
    const result = dates({
      startsOn: "2028-01-30",
      endsOn: "2028-03-30",
      today: "2028-01-01",
    });

    expect(result).toEqual(["2028-01-30", "2028-02-29", "2028-03-30"]);
  });

  test("steps by the interval", () => {
    const result = dates({
      interval: 3,
      startsOn: "2026-01-15",
      endsOn: "2026-10-15",
      today: "2026-01-01",
    });

    expect(result).toEqual([
      "2026-01-15",
      "2026-04-15",
      "2026-07-15",
      "2026-10-15",
    ]);
  });

  test("rolls the year", () => {
    const result = dates({
      startsOn: "2026-11-20",
      endsOn: "2027-02-20",
      today: "2026-11-01",
    });

    expect(result).toEqual([
      "2026-11-20",
      "2026-12-20",
      "2027-01-20",
      "2027-02-20",
    ]);
  });
});

describe("weekly", () => {
  test("steps seven days at a time", () => {
    const result = dates({
      recurrenceType: RecurrenceType.WEEKLY,
      startsOn: "2026-07-06",
      endsOn: "2026-07-27",
    });

    expect(result).toEqual([
      "2026-07-06",
      "2026-07-13",
      "2026-07-20",
      "2026-07-27",
    ]);
  });

  test("steps by the interval in weeks", () => {
    const result = dates({
      recurrenceType: RecurrenceType.WEEKLY,
      interval: 2,
      startsOn: "2026-07-06",
      endsOn: "2026-08-03",
    });

    expect(result).toEqual(["2026-07-06", "2026-07-20", "2026-08-03"]);
  });

  test("crosses a month boundary", () => {
    const result = dates({
      recurrenceType: RecurrenceType.WEEKLY,
      startsOn: "2026-07-29",
      endsOn: "2026-08-12",
    });

    expect(result).toEqual(["2026-07-29", "2026-08-05", "2026-08-12"]);
  });
});

describe("yearly", () => {
  test("steps a year at a time", () => {
    const result = dates({
      recurrenceType: RecurrenceType.YEARLY,
      startsOn: "2026-03-15",
      endsOn: "2029-03-15",
      today: "2026-01-01",
    });

    // Bounded by the horizon, not the end date, since the horizon is nearer.
    expect(result).toEqual(["2026-03-15"]);
  });

  test("clamps a Feb 29 anchor to Feb 28 in common years", () => {
    const result = dates({
      recurrenceType: RecurrenceType.YEARLY,
      startsOn: "2028-02-29",
      endsOn: "2030-02-28",
      // Far enough along that the 2029 step is inside the horizon.
      today: "2028-03-01",
    });

    expect(result[0]).toBe("2028-02-29");
    expect(result[1]).toBe("2029-02-28");
  });

  test("generates dates before today for a series that already started", () => {
    const result = dates({
      recurrenceType: RecurrenceType.MONTHLY,
      startsOn: "2026-05-10",
      endsOn: "2026-08-10",
      today: TODAY,
    });

    // History matters: a series that began in the past keeps its earlier rows.
    expect(result[0]).toBe("2026-05-10");
    expect(result.length).toBe(4);
  });
});

describe("derived end date", () => {
  test("lands the same day and month, 50 years on", () => {
    expect(seriesEndsOn("2026-07-05")).toBe("2076-07-05");
    expect(RECURRENCE_YEARS).toBe(50);
  });

  test("keeps a month-end anchor", () => {
    expect(seriesEndsOn("2026-01-31")).toBe("2076-01-31");
  });

  test("clamps a Feb 29 anchor into a common year", () => {
    // 2078 is not a leap year, so the end date is the 28th rather than March.
    expect(seriesEndsOn("2028-02-29")).toBe("2078-02-28");
  });

  test("bounds an open-ended series that outlives the horizon", () => {
    const startsOn = "2026-07-05";

    const result = dates({ startsOn, endsOn: seriesEndsOn(startsOn) });

    // The horizon is the nearer limit, so the 50-year end never truncates it.
    expect(result.length).toBe(HORIZON_MONTHS);
  });
});

describe("guards", () => {
  test("rejects an interval below 1", () => {
    expect(() => dates({ interval: 0 })).toThrow();
  });

  test("a start date beyond the horizon still yields nothing rather than looping", () => {
    const result = dates({ startsOn: "2099-01-01" });

    expect(result).toEqual([]);
  });

  test("a weekly series is capped rather than unbounded", () => {
    const result = dates({
      recurrenceType: RecurrenceType.WEEKLY,
      startsOn: "2026-07-06",
      endsOn: null,
    });

    expect(result.length).toBeLessThanOrEqual(MAX_OCCURRENCES);
    expect(result.length).toBeGreaterThan(50);
  });

  test("dates come back in ascending order", () => {
    const result = dates({ startsOn: "2026-07-05" });

    expect(result).toEqual([...result].sort());
  });
});
