import { formatMinorUnits, MONEY_MAX_MINOR_UNITS } from "@budget-manager/money";
import { describe, expect, test } from "bun:test";
import { nextCurrencyValue, type CurrencyTypingInput } from "./currency-typing";

type Options = Omit<CurrencyTypingInput, "typed" | "value" | "currencyCode">;

/** A digit landing at the caret, which is always past the last character. */
function press(
  value: number,
  currencyCode: string,
  character: string,
  options: Options = {},
) {
  return nextCurrencyValue({
    typed: formatMinorUnits(value, currencyCode) + character,
    value,
    currencyCode,
    ...options,
  });
}

/** Backspace at that same caret: the last character goes, whatever it is. */
function backspace(value: number, currencyCode: string, options: Options = {}) {
  return nextCurrencyValue({
    typed: formatMinorUnits(value, currencyCode).slice(0, -1),
    value,
    currencyCode,
    ...options,
  });
}

/** A whole-string replacement, the way a paste or an autofill arrives. */
function fill(
  value: number,
  currencyCode: string,
  typed: string,
  options: Options = {},
) {
  return nextCurrencyValue({ typed, value, currencyCode, ...options });
}

describe("nextCurrencyValue", () => {
  test("shifts digits in from the right, one keystroke at a time", () => {
    let value = 0;
    const reading: number[] = [];

    for (const digit of ["1", "2", "3", "4", "5"]) {
      value = press(value, "BRL", digit);
      reading.push(value);
    }

    expect(reading).toEqual([1, 12, 123, 1234, 12345]);
    expect(formatMinorUnits(value, "BRL").replace(/\s/g, " ")).toBe("R$ 123,45");
  });

  test("drops the rightmost digit on backspace", () => {
    expect(backspace(12345, "BRL")).toBe(1234);
    expect(backspace(1234, "BRL")).toBe(123);
    expect(backspace(1, "BRL")).toBe(0);
  });

  test("drops a digit when a separator is cut out of the middle", () => {
    const shown = formatMinorUnits(12345, "BRL");

    expect(fill(12345, "BRL", shown.replace(",", ""))).toBe(1234);
  });

  test("drops a digit when backspace lands on the currency symbol", () => {
    expect(formatMinorUnits(123456, "EUR").endsWith("€")).toBe(true);
    expect(backspace(123456, "EUR")).toBe(12345);
  });

  test("takes a whole-string replacement at its word", () => {
    expect(fill(200000, "BRL", "250000")).toBe(250000);
  });

  test("ignores a keystroke that is not a digit", () => {
    expect(press(1234, "BRL", "a")).toBe(1234);
  });

  test("treats cleared input as zero", () => {
    expect(fill(1234, "BRL", "")).toBe(0);
    expect(fill(1234, "BRL", "R$ ")).toBe(0);
  });

  test("rejects amounts beyond the int4 column ceiling without moving", () => {
    expect(fill(1234, "BRL", "99999999999")).toBe(1234);
    expect(fill(1234, "BRL", `${MONEY_MAX_MINOR_UNITS + 1}`)).toBe(1234);
    expect(fill(1234, "BRL", `${MONEY_MAX_MINOR_UNITS}`)).toBe(
      MONEY_MAX_MINOR_UNITS,
    );
  });

  test("honours a lower ceiling a caller sets", () => {
    expect(fill(500, "BRL", "1200", { maxValue: 1000 })).toBe(500);
    expect(fill(500, "BRL", "900", { maxValue: 1000 })).toBe(900);
  });

  test("shifts whole units for a zero-decimal currency", () => {
    let value = 0;

    for (const digit of ["1", "2", "3"]) {
      value = press(value, "JPY", digit);
    }

    expect(value).toBe(123);
    expect(formatMinorUnits(value, "JPY")).toContain("123");
    expect(backspace(value, "JPY")).toBe(12);
  });

  test("shifts three places for a three-decimal currency", () => {
    let value = 0;

    for (const digit of ["1", "2", "3", "4"]) {
      value = press(value, "BHD", digit);
    }

    expect(value).toBe(1234);
    expect(formatMinorUnits(value, "BHD").replace(/\s/g, " ")).toBe("BHD 1.234");
    expect(backspace(value, "BHD")).toBe(123);
  });

  test("keeps a deleted separator a deletion for a zero-decimal currency", () => {
    const shown = formatMinorUnits(123456, "JPY");

    expect(shown).toContain(",");
    expect(fill(123456, "JPY", shown.replace(",", ""))).toBe(12345);
  });

  test("takes a sign only when negatives are allowed", () => {
    expect(fill(0, "BRL", "-5")).toBe(5);
    expect(fill(0, "BRL", "-5", { allowNegative: true })).toBe(-5);
  });

  test("keeps typing into a negative amount negative", () => {
    let value = fill(0, "BRL", "-5", { allowNegative: true });

    value = press(value, "BRL", "0", { allowNegative: true });

    expect(value).toBe(-50);
    expect(backspace(value, "BRL", { allowNegative: true })).toBe(-5);
  });

  test("reads a sign typed over an amount as that amount, negated", () => {
    const shown = formatMinorUnits(500, "BRL");

    expect(fill(500, "BRL", `-${shown}`, { allowNegative: true })).toBe(-500);
  });

  test("reads a dropped sign as the amount turning positive", () => {
    const shown = formatMinorUnits(-500, "BRL");

    expect(shown.startsWith("-")).toBe(true);
    expect(fill(-500, "BRL", shown.slice(1), { allowNegative: true })).toBe(500);
  });

  test("has no negative zero to fall into", () => {
    expect(fill(0, "BRL", "-", { allowNegative: true })).toBe(0);
    expect(fill(-5, "BRL", "-R$ 0,00", { allowNegative: true })).toBe(0);
  });
});
