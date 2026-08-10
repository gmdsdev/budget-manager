import { nextCurrencyValue } from "@budget-manager/client";
import { formatMinorUnits } from "@budget-manager/money";

import { Input } from "@/components/ui/input";

/**
 * Reads and writes integer **minor units** directly — never a float, and never a
 * major-unit string the caller has to convert. The field shows the currency's own
 * formatting and typing shifts digits in from the right, the way a card machine
 * reads a keypad, so the decimal point is never something the user has to place:
 * 1, 2, 3 reads as 1,23. `nextCurrencyValue` (`@budget-manager/client`) is what
 * decides that, shared with the web, so a keystroke cannot mean one thing on a
 * phone and another in a browser — including a deleted separator (which trims a
 * digit rather than leaving the field feeling dead) and an amount past the `int4`
 * ceiling (which is refused rather than clamped, leaving the value where it was).
 *
 * The caret is **derived from the display, never held in state**: digits shift in
 * from the right, so it belongs past the last character and nowhere else. React
 * Native pushes text and selection to the platform in one command, so a selection
 * computed from the same `value` that produced the text arrives with it rather
 * than a frame behind — which is the shape of controlled selection an Android IME
 * does not fight. A numeric keypad has no composing region to lose either.
 */
export function CurrencyInput({
  value,
  currencyCode,
  onValueChange,
  onBlur,
  invalid,
  accessibilityLabel,
  allowNegative = false,
  maxValue,
}: {
  value: number;
  currencyCode: string;
  onValueChange: (value: number) => void;
  onBlur?: () => void;
  invalid?: boolean;
  accessibilityLabel?: string;
  allowNegative?: boolean;
  maxValue?: number;
}) {
  const display = formatMinorUnits(value, currencyCode);

  return (
    <Input
      // Numeric only: a currency field has no use for a full keyboard, and the
      // separators are the formatter's to place. A signed field needs the minus,
      // which only the punctuation layout offers.
      keyboardType={allowNegative ? "numbers-and-punctuation" : "number-pad"}
      autoCorrect={false}
      invalid={invalid}
      accessibilityLabel={accessibilityLabel}
      value={display}
      selection={{ start: display.length, end: display.length }}
      onBlur={onBlur}
      onChangeText={(text) => {
        const next = nextCurrencyValue({
          typed: text,
          value,
          currencyCode,
          allowNegative,
          maxValue,
        });

        if (next !== value) {
          onValueChange(next);
        }
      }}
      style={{ fontVariant: ["tabular-nums"] }}
    />
  );
}
