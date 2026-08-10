import { formatMinorUnits, MONEY_MAX_MINOR_UNITS } from "@budget-manager/money";

function digitsOf(text: string) {
  return text.replace(/\D/g, "");
}

/**
 * Whether the new string is a contiguous cut out of the old one — a matching
 * prefix and suffix accounting for everything that is left. Digit count alone
 * cannot tell a deletion from a replacement: filling `250000` over
 * `R$ 2.000,00` keeps six digits and would otherwise read as a separator
 * having been deleted.
 */
function isDeletion(typed: string, display: string) {
  if (typed.length >= display.length) {
    return false;
  }

  let prefix = 0;

  while (prefix < typed.length && typed[prefix] === display[prefix]) {
    prefix++;
  }

  let suffix = 0;

  while (
    suffix < typed.length - prefix &&
    typed[typed.length - 1 - suffix] === display[display.length - 1 - suffix]
  ) {
    suffix++;
  }

  return prefix + suffix === typed.length;
}

export type CurrencyTypingInput = {
  /** The text the field now holds, separators, symbol and all. */
  typed: string;
  /** The value the field was showing before the keystroke, in minor units. */
  value: number;
  currencyCode: string;
  allowNegative?: boolean;
  maxValue?: number;
};

/**
 * Reads a keystroke the way a card machine reads a keypad: digits shift in from
 * the right and the formatter places the separators, so the decimal point is
 * never something the user has to aim at. The previous display is derived from
 * `value`, which is what both apps render, so this needs nothing but the text
 * the field now holds.
 *
 * Two cases the digit count cannot decide on its own. A **deleted separator**
 * leaves the digits untouched — backspacing over the `,` in `1,23` yields `123`
 * — so a shorter string that is a contiguous cut of the old one is read as the
 * deletion it was meant to be and the magnitude loses its rightmost digit
 * instead. That is also what makes backspace work where the last character is
 * the currency symbol rather than a digit, as in `1.234,56 €`. And a
 * **rejected** amount — past the `int4` ceiling the column can hold — returns
 * the value unchanged rather than clamping, so the keystroke simply does not
 * land.
 */
export function nextCurrencyValue({
  typed,
  value,
  currencyCode,
  allowNegative = false,
  maxValue = MONEY_MAX_MINOR_UNITS,
}: CurrencyTypingInput): number {
  const display = formatMinorUnits(value, currencyCode);

  const before = digitsOf(display);
  const after = digitsOf(typed);
  const signChanged =
    allowNegative && typed.includes("-") !== display.includes("-");

  const trimmedSeparator =
    !signChanged && after.length === before.length && isDeletion(typed, display);

  const magnitude = trimmedSeparator
    ? Math.trunc(Number(before || "0") / 10)
    : Number(after || "0");

  const negative = allowNegative && typed.includes("-") && magnitude !== 0;
  const parsed = negative ? -magnitude : magnitude;
  const rejected = magnitude > maxValue || !Number.isSafeInteger(parsed);

  return rejected ? value : parsed;
}
