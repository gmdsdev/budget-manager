import { describe, expect, test } from "bun:test";

import {
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
