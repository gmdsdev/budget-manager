import { describe, expect, test } from "bun:test";

import {
  formatCompactMinorUnits,
  formatMinorUnits,
  minorUnitDigits,
  MONEY_MAX_MINOR_UNITS,
  parseMinorUnits,
} from "./index";

describe("minorUnitDigits", () => {
  test("defaults to 2 for ordinary currencies", () => {
    expect(minorUnitDigits("BRL")).toBe(2);
    expect(minorUnitDigits("USD")).toBe(2);
    expect(minorUnitDigits("EUR")).toBe(2);
  });

  test("returns 0 for zero-decimal currencies", () => {
    expect(minorUnitDigits("JPY")).toBe(0);
    expect(minorUnitDigits("KRW")).toBe(0);
  });

  test("returns 3 for three-decimal currencies", () => {
    expect(minorUnitDigits("BHD")).toBe(3);
    expect(minorUnitDigits("KWD")).toBe(3);
  });

  test("is case-insensitive and falls back for unknown codes", () => {
    expect(minorUnitDigits("jpy")).toBe(0);
    expect(minorUnitDigits("ZZZ")).toBe(2);
    expect(minorUnitDigits("")).toBe(2);
  });
});

describe("formatMinorUnits", () => {
  test("scales by the currency's own minor unit, not a hardcoded 100", () => {
    expect(formatMinorUnits(1000, "JPY")).toContain("1,000");
    expect(formatMinorUnits(1000, "JPY")).not.toContain("10.00");
  });

  test("renders zero-decimal currencies without a fractional part", () => {
    expect(formatMinorUnits(1050, "JPY")).not.toContain(".");
    expect(formatMinorUnits(1050, "KRW")).not.toContain(".");
  });

  test("renders two-decimal currencies with cents", () => {
    expect(formatMinorUnits(1050, "BRL")).toContain("10,50");
    expect(formatMinorUnits(1050, "USD")).toContain("10.50");
  });

  test("renders three-decimal currencies with thousandths", () => {
    expect(formatMinorUnits(1050, "BHD")).toContain("1.050");
  });

  test("does not throw on a malformed currency code", () => {
    expect(() => formatMinorUnits(1050, "NOT_A_CODE")).not.toThrow();
    expect(() => formatMinorUnits(1050, "")).not.toThrow();
    expect(() => formatMinorUnits(1050, "12")).not.toThrow();
    expect(formatMinorUnits(1050, "NOT_A_CODE")).toContain("10.50");
  });

  test("does not throw on non-finite amounts", () => {
    expect(() => formatMinorUnits(Number.NaN, "USD")).not.toThrow();
    expect(() =>
      formatMinorUnits(Number.POSITIVE_INFINITY, "USD"),
    ).not.toThrow();
  });

  test("is deterministic regardless of host locale", () => {
    const first = formatMinorUnits(123456, "USD");
    const second = formatMinorUnits(123456, "USD");

    expect(first).toBe(second);
    expect(first).toContain("1,234.56");
  });
});

describe("formatCompactMinorUnits", () => {
  test("shortens thousands and millions", () => {
    expect(formatCompactMinorUnits(1_000_00, "USD")).toBe("$1K");
    expect(formatCompactMinorUnits(12_345_67, "USD")).toBe("$12.3K");
    expect(formatCompactMinorUnits(1_234_567_89, "USD")).toBe("$1.2M");
  });

  test("keeps the exact amount below one thousand, so a tick stays findable", () => {
    expect(formatCompactMinorUnits(999_99, "USD")).toBe(
      formatMinorUnits(999_99, "USD"),
    );
    expect(formatCompactMinorUnits(0, "USD")).toBe(formatMinorUnits(0, "USD"));
  });

  test("keeps the sign on money going out", () => {
    expect(formatCompactMinorUnits(-450_000_00, "USD")).toBe("-$450K");
  });

  test("scales by the currency's own minor unit, and compacts the locale's way", () => {
    // 12,345 yen, not 123.45 — and ja-JP counts in 万, not thousands.
    expect(formatCompactMinorUnits(12_345, "JPY")).toBe("¥1.2万");
    // Intl separates with a non-breaking space, so compare on flattened text.
    expect(
      formatCompactMinorUnits(1_234_500, "BRL").replace(/\s/g, " "),
    ).toBe("R$ 12,3 mil");
  });

  test("falls back to the plain format for a code Intl cannot handle", () => {
    expect(formatCompactMinorUnits(1_000_00, "ZZ")).toBe(
      formatMinorUnits(1_000_00, "ZZ"),
    );
  });
});

describe("parseMinorUnits", () => {
  test("reads digits as minor units", () => {
    expect(parseMinorUnits("1234")).toBe(1234);
    expect(parseMinorUnits("R$ 12,34")).toBe(1234);
    expect(parseMinorUnits("$1,234.56")).toBe(123456);
  });

  test("treats empty input as zero", () => {
    expect(parseMinorUnits("")).toBe(0);
    expect(parseMinorUnits("R$")).toBe(0);
  });

  test("ignores a minus sign unless negatives are allowed", () => {
    expect(parseMinorUnits("-1234")).toBe(1234);
    expect(parseMinorUnits("-1234", { allowNegative: true })).toBe(-1234);
  });
});

describe("money bounds", () => {
  test("max matches the Postgres int4 ceiling the columns use", () => {
    expect(MONEY_MAX_MINOR_UNITS).toBe(2_147_483_647);
  });
});
