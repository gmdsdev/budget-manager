import { describe, expect, test } from "bun:test";

import { cycleFor, deriveBillStatus } from "./cycle";

const CLOSE_10_DUE_20 = { closeDay: 10, dueDay: 20 };
const CLOSE_25_DUE_5 = { closeDay: 25, dueDay: 5 };

describe("cycleFor", () => {
  test("a purchase before the close lands on the statement closing this month", () => {
    expect(cycleFor({ date: "2026-07-03", ...CLOSE_10_DUE_20 })).toEqual({
      periodStart: "2026-06-11",
      periodEnd: "2026-07-10",
      closeAt: "2026-07-10",
      dueAt: "2026-07-20",
    });
  });

  test("a purchase after the close rolls onto the next statement", () => {
    expect(cycleFor({ date: "2026-07-15", ...CLOSE_10_DUE_20 })).toEqual({
      periodStart: "2026-07-11",
      periodEnd: "2026-08-10",
      closeAt: "2026-08-10",
      dueAt: "2026-08-20",
    });
  });

  test("a purchase exactly on the closing day is still on that statement", () => {
    const cycle = cycleFor({ date: "2026-07-10", ...CLOSE_10_DUE_20 });

    expect(cycle.closeAt).toBe("2026-07-10");
    expect(cycle.periodStart).toBe("2026-06-11");
  });

  test("a purchase the day after the close starts the next period", () => {
    const cycle = cycleFor({ date: "2026-07-11", ...CLOSE_10_DUE_20 });

    expect(cycle.periodStart).toBe("2026-07-11");
    expect(cycle.closeAt).toBe("2026-08-10");
  });

  test("consecutive periods abut with no gap and no overlap", () => {
    const first = cycleFor({ date: "2026-07-05", ...CLOSE_10_DUE_20 });
    const second = cycleFor({ date: "2026-07-20", ...CLOSE_10_DUE_20 });

    expect(first.periodEnd).toBe("2026-07-10");
    expect(second.periodStart).toBe("2026-07-11");
  });

  test("the due date falls after the close in the same month when dueDay is later", () => {
    const cycle = cycleFor({ date: "2026-07-03", ...CLOSE_10_DUE_20 });

    expect(cycle.dueAt > cycle.closeAt).toBe(true);
    expect(cycle.dueAt).toBe("2026-07-20");
  });

  test("the due date rolls into the next month when dueDay is earlier", () => {
    expect(cycleFor({ date: "2026-07-12", ...CLOSE_25_DUE_5 })).toEqual({
      periodStart: "2026-06-26",
      periodEnd: "2026-07-25",
      closeAt: "2026-07-25",
      dueAt: "2026-08-05",
    });
  });

  test("an equal close and due day pushes the due date to the next month", () => {
    const cycle = cycleFor({ date: "2026-07-03", closeDay: 10, dueDay: 10 });

    expect(cycle.closeAt).toBe("2026-07-10");
    expect(cycle.dueAt).toBe("2026-08-10");
    expect(cycle.dueAt > cycle.closeAt).toBe(true);
  });

  test("rolls the year at a December close", () => {
    expect(cycleFor({ date: "2026-12-15", ...CLOSE_10_DUE_20 })).toEqual({
      periodStart: "2026-12-11",
      periodEnd: "2027-01-10",
      closeAt: "2027-01-10",
      dueAt: "2027-01-20",
    });
  });

  test("rolls the year for a due date after a December close", () => {
    const cycle = cycleFor({ date: "2026-12-03", ...CLOSE_25_DUE_5 });

    expect(cycle.closeAt).toBe("2026-12-25");
    expect(cycle.dueAt).toBe("2027-01-05");
  });

  test("rolls the year backwards for a January period start", () => {
    const cycle = cycleFor({ date: "2026-01-05", ...CLOSE_10_DUE_20 });

    expect(cycle.periodStart).toBe("2025-12-11");
    expect(cycle.closeAt).toBe("2026-01-10");
  });

  test("a period start after a 28-day February is still the 1st of March", () => {
    // Close on the 28th, so the next period begins March 1st.
    const cycle = cycleFor({ date: "2026-03-05", closeDay: 28, dueDay: 10 });

    expect(cycle.periodStart).toBe("2026-03-01");
    expect(cycle.closeAt).toBe("2026-03-28");
  });

  test("handles a leap-year February close", () => {
    const cycle = cycleFor({ date: "2028-02-20", closeDay: 28, dueDay: 10 });

    expect(cycle.periodStart).toBe("2028-01-29");
    expect(cycle.closeAt).toBe("2028-02-28");
    expect(cycle.dueAt).toBe("2028-03-10");
  });

  test("a day-1 close gives single-day-start periods", () => {
    const cycle = cycleFor({ date: "2026-07-01", closeDay: 1, dueDay: 15 });

    expect(cycle.periodStart).toBe("2026-06-02");
    expect(cycle.closeAt).toBe("2026-07-01");
    expect(cycle.dueAt).toBe("2026-07-15");
  });

  test("rejects a malformed date", () => {
    expect(() => cycleFor({ date: "05-07-2026", ...CLOSE_10_DUE_20 })).toThrow();
  });

  test("every date in a period maps to the same statement", () => {
    const dates = ["2026-06-11", "2026-06-30", "2026-07-01", "2026-07-10"];
    const closes = dates.map(
      (date) => cycleFor({ date, ...CLOSE_10_DUE_20 }).closeAt,
    );

    expect(new Set(closes).size).toBe(1);
    expect(closes[0]).toBe("2026-07-10");
  });
});

describe("deriveBillStatus", () => {
  const base = { closeAt: "2026-07-10", today: "2026-07-05" };

  test("is open before the close date", () => {
    expect(
      deriveBillStatus({ ...base, statementTotalCents: 5_000, paidCents: 0 }),
    ).toBe("open");
  });

  test("is open on the closing day itself", () => {
    expect(
      deriveBillStatus({
        ...base,
        today: "2026-07-10",
        statementTotalCents: 5_000,
        paidCents: 0,
      }),
    ).toBe("open");
  });

  test("awaits payment once the close date has passed", () => {
    expect(
      deriveBillStatus({
        ...base,
        today: "2026-07-11",
        statementTotalCents: 5_000,
        paidCents: 0,
      }),
    ).toBe("awaiting_payment");
  });

  test("is paid when covered in full, even before closing", () => {
    expect(
      deriveBillStatus({
        ...base,
        statementTotalCents: 5_000,
        paidCents: 5_000,
      }),
    ).toBe("paid");
  });

  test("is paid when overpaid", () => {
    expect(
      deriveBillStatus({
        ...base,
        statementTotalCents: 5_000,
        paidCents: 6_000,
      }),
    ).toBe("paid");
  });

  test("a partial payment does not settle it", () => {
    expect(
      deriveBillStatus({
        ...base,
        today: "2026-07-11",
        statementTotalCents: 5_000,
        paidCents: 4_999,
      }),
    ).toBe("awaiting_payment");
  });

  test("an empty statement is never 'paid'", () => {
    // Nothing was spent, so there is nothing to settle.
    expect(
      deriveBillStatus({ ...base, statementTotalCents: 0, paidCents: 0 }),
    ).toBe("open");
    expect(
      deriveBillStatus({
        ...base,
        today: "2026-07-11",
        statementTotalCents: 0,
        paidCents: 0,
      }),
    ).toBe("awaiting_payment");
  });
});
