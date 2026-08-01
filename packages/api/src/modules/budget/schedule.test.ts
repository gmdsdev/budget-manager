import { RecurrenceType } from "@budget-manager/schemas";
import { describe, expect, test } from "bun:test";

import { budgetEndsOn, budgetMonths, HORIZON_MONTHS } from "./schedule";

const TODAY = "2026-07";

function months(
  over: Partial<Parameters<typeof budgetMonths>[0]> = {},
): string[] {
  return budgetMonths({
    recurrenceType: RecurrenceType.MONTHLY,
    interval: 1,
    installments: null,
    startsOn: TODAY,
    endsOn: null,
    today: TODAY,
    ...over,
  });
}

describe("budgetEndsOn", () => {
  test("runs fifty years out from the starting month", () => {
    expect(budgetEndsOn("2026-07")).toBe("2076-07");
  });

  test("keeps the month across a December start", () => {
    expect(budgetEndsOn("2026-12")).toBe("2076-12");
  });
});

describe("budgetMonths — monthly", () => {
  test("covers the horizon inclusively, starting at the anchor", () => {
    const result = months();

    expect(result[0]).toBe("2026-07");
    expect(result.at(-1)).toBe("2027-07");
    expect(result).toHaveLength(HORIZON_MONTHS + 1);
  });

  test("rolls across the year boundary", () => {
    expect(months({ startsOn: "2026-11", today: "2026-11" }).slice(0, 4)).toEqual(
      ["2026-11", "2026-12", "2027-01", "2027-02"],
    );
  });

  test("an interval of three lands a quarterly budget", () => {
    expect(months({ interval: 3 })).toEqual([
      "2026-07",
      "2026-10",
      "2027-01",
      "2027-04",
      "2027-07",
    ]);
  });

  test("stops at an end month earlier than the horizon", () => {
    expect(months({ endsOn: "2026-10" })).toEqual([
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
  });

  test("ignores an end month beyond the horizon", () => {
    expect(months({ endsOn: "2099-01" }).at(-1)).toBe("2027-07");
  });

  test("a series that already started only reaches the horizon from today", () => {
    const result = months({ startsOn: "2026-01" });

    expect(result[0]).toBe("2026-01");
    expect(result.at(-1)).toBe("2027-07");
  });

  test("a series starting after the horizon produces nothing yet", () => {
    expect(months({ startsOn: "2028-01" })).toEqual([]);
  });
});

describe("budgetMonths — yearly", () => {
  test("steps twelve months at a time", () => {
    expect(
      budgetMonths({
        recurrenceType: RecurrenceType.YEARLY,
        interval: 1,
        installments: null,
        startsOn: "2026-03",
        endsOn: "2030-03",
        today: "2026-03",
      }),
    ).toEqual(["2026-03", "2027-03"]);
  });
});

describe("budgetMonths — fixed", () => {
  test("produces exactly the requested count, past the horizon", () => {
    const result = budgetMonths({
      recurrenceType: RecurrenceType.FIXED,
      interval: 1,
      installments: 18,
      startsOn: "2026-07",
      endsOn: null,
      today: TODAY,
    });

    expect(result).toHaveLength(18);
    expect(result.at(-1)).toBe("2027-12");
  });

  test("honours the interval between periods", () => {
    expect(
      budgetMonths({
        recurrenceType: RecurrenceType.FIXED,
        interval: 2,
        installments: 3,
        startsOn: "2026-07",
        endsOn: null,
        today: TODAY,
      }),
    ).toEqual(["2026-07", "2026-09", "2026-11"]);
  });

  test("rejects a fixed budget with no count", () => {
    expect(() =>
      budgetMonths({
        recurrenceType: RecurrenceType.FIXED,
        interval: 1,
        installments: null,
        startsOn: TODAY,
        endsOn: null,
        today: TODAY,
      }),
    ).toThrow();
  });
});

describe("budgetMonths — guards", () => {
  test("rejects an interval below one", () => {
    expect(() => months({ interval: 0 })).toThrow();
  });

  test("rejects a malformed start month", () => {
    expect(() => months({ startsOn: "2026-7" })).toThrow();
  });
});
