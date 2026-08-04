import { describe, expect, test } from "bun:test";

import {
  DATE_RANGE_PRESETS,
  isWholeMonthRange,
  shiftDateRange,
  type DateRangePresetKey,
  type DateRangeValue,
} from "./date-range";

/** A Monday in a leap February, so month ends and week starts are both in play. */
const ANCHOR = new Date(2028, 1, 14);

function rangeFor(labelKey: DateRangePresetKey) {
  return DATE_RANGE_PRESETS.find(
    (preset) => preset.labelKey === labelKey,
  )?.getRange(ANCHOR);
}

describe("DATE_RANGE_PRESETS", () => {
  test("covers whole months, including a leap February", () => {
    expect(rangeFor("dateRange.thisMonth")).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
    expect(rangeFor("dateRange.lastMonth")).toEqual({
      from: "2028-01-01",
      to: "2028-01-31",
    });
  });

  test("weeks run Sunday to Saturday, where both calendar grids draw them", () => {
    expect(rangeFor("dateRange.thisWeek")).toEqual({
      from: "2028-02-13",
      to: "2028-02-19",
    });
    expect(rangeFor("dateRange.lastWeek")).toEqual({
      from: "2028-02-06",
      to: "2028-02-12",
    });
  });

  test("today is a range of one day, not an open end", () => {
    expect(rangeFor("dateRange.today")).toEqual({
      from: "2028-02-14",
      to: "2028-02-14",
    });
  });
});

describe("shiftDateRange", () => {
  const month: DateRangeValue = { from: "2028-01-01", to: "2028-01-31" };

  test("moves a whole month by a month, not by 31 days", () => {
    expect(shiftDateRange(month, 1)).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
  });

  test("steps back into the month it came from", () => {
    expect(
      shiftDateRange({ from: "2028-03-01", to: "2028-03-31" }, -1),
    ).toEqual({ from: "2028-02-01", to: "2028-02-29" });
  });

  test("crosses the year boundary", () => {
    expect(
      shiftDateRange({ from: "2026-12-01", to: "2026-12-31" }, 1),
    ).toEqual({ from: "2027-01-01", to: "2027-01-31" });
    expect(shiftDateRange({ from: "2027-01-01", to: "2027-01-31" }, -1)).toEqual(
      { from: "2026-12-01", to: "2026-12-31" },
    );
  });

  test("a stepped month is still a month, so it keeps stepping by one", () => {
    // The unit comes from the range itself: nothing remembers which preset set it,
    // so February reached from January still advances to March.
    expect(shiftDateRange(shiftDateRange(month, 1), 1)).toEqual({
      from: "2028-03-01",
      to: "2028-03-31",
    });
    expect(shiftDateRange(shiftDateRange(month, 1), -1)).toEqual(month);
  });

  test("a span of whole months moves by its own count of them", () => {
    expect(
      shiftDateRange({ from: "2026-01-01", to: "2026-03-31" }, 1),
    ).toEqual({ from: "2026-04-01", to: "2026-06-30" });
  });

  test("moves a week by a week", () => {
    expect(
      shiftDateRange({ from: "2026-08-02", to: "2026-08-08" }, 1),
    ).toEqual({ from: "2026-08-09", to: "2026-08-15" });
    expect(
      shiftDateRange({ from: "2026-08-02", to: "2026-08-08" }, -1),
    ).toEqual({ from: "2026-07-26", to: "2026-08-01" });
  });

  test("moves a single day by a day", () => {
    expect(
      shiftDateRange({ from: "2026-08-03", to: "2026-08-03" }, 1),
    ).toEqual({ from: "2026-08-04", to: "2026-08-04" });
    expect(
      shiftDateRange({ from: "2026-08-03", to: "2026-08-03" }, -1),
    ).toEqual({ from: "2026-08-02", to: "2026-08-02" });
  });

  test("moves a hand-drawn range by its own length", () => {
    // 3 to 15 August is thirteen days, counting both ends.
    const custom: DateRangeValue = { from: "2026-08-03", to: "2026-08-15" };

    expect(shiftDateRange(custom, 1)).toEqual({
      from: "2026-08-16",
      to: "2026-08-28",
    });
    expect(shiftDateRange(custom, -1)).toEqual({
      from: "2026-07-21",
      to: "2026-08-02",
    });
  });

  test("a range that only ends on a month end is not a month", () => {
    // 17 days, so it moves 17 days rather than snapping to February.
    expect(
      shiftDateRange({ from: "2026-01-15", to: "2026-01-31" }, 1),
    ).toEqual({ from: "2026-02-01", to: "2026-02-17" });
  });

  test("leaves an incomplete range alone", () => {
    expect(shiftDateRange({ from: "", to: "" }, 1)).toEqual({
      from: "",
      to: "",
    });
  });
});

describe("isWholeMonthRange", () => {
  test("is the period a trigger can name instead of reciting", () => {
    expect(isWholeMonthRange({ from: "2026-08-01", to: "2026-08-31" })).toBe(
      true,
    );
    expect(isWholeMonthRange({ from: "2028-02-01", to: "2028-02-29" })).toBe(
      true,
    );
  });

  test("a part of a month, or more than one, reads as its ends", () => {
    expect(isWholeMonthRange({ from: "2026-08-03", to: "2026-08-15" })).toBe(
      false,
    );
    expect(isWholeMonthRange({ from: "2026-08-01", to: "2026-08-30" })).toBe(
      false,
    );
    expect(isWholeMonthRange({ from: "2026-01-01", to: "2026-03-31" })).toBe(
      false,
    );
    expect(isWholeMonthRange({ from: "", to: "" })).toBe(false);
  });
});
