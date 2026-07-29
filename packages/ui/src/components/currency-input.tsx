import * as React from "react";

import {
  formatMinorUnits,
  MONEY_MAX_MINOR_UNITS,
  parseMinorUnits,
} from "@budget-manager/money";
import { Input } from "./input";

function isDigit(character: string | undefined) {
  return character !== undefined && character >= "0" && character <= "9";
}

function digitsBefore(text: string, caret: number) {
  let count = 0;

  for (let index = 0; index < caret && index < text.length; index++) {
    if (isDigit(text[index])) {
      count++;
    }
  }

  return count;
}

function offsetAfterDigit(text: string, n: number) {
  if (n <= 0) {
    const first = text.search(/\d/);

    return first === -1 ? text.length : first;
  }

  let seen = 0;

  for (let index = 0; index < text.length; index++) {
    if (isDigit(text[index]) && ++seen === n) {
      return index + 1;
    }
  }

  return text.length;
}

export type CurrencyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange" | "type" | "inputMode"
> & {
  value: number;
  onValueChange: (value: number) => void;
  currencyCode: string;
  allowNegative?: boolean;
  maxValue?: number;
};

export function CurrencyInput({
  value,
  onValueChange,
  currencyCode,
  allowNegative = false,
  maxValue = MONEY_MAX_MINOR_UNITS,
  ...props
}: CurrencyInputProps) {
  const display = formatMinorUnits(value, currencyCode);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const element = event.currentTarget;
    const typed = element.value;
    const caret = element.selectionEnd ?? typed.length;
    const targetDigits = digitsBefore(typed, caret);

    const parsed = parseMinorUnits(typed, { allowNegative });
    const rejected =
      Math.abs(parsed) > maxValue || !Number.isSafeInteger(parsed);
    const next = rejected ? value : parsed;
    const nextDisplay = formatMinorUnits(next, currencyCode);

    element.value = nextDisplay;

    const position = offsetAfterDigit(
      nextDisplay,
      rejected ? targetDigits - 1 : targetDigits,
    );
    element.setSelectionRange(position, position);

    if (next !== value) {
      onValueChange(next);
    }
  }

  return (
    <Input
      {...props}
      value={display}
      onChange={handleChange}
      inputMode={allowNegative ? "text" : "numeric"}
      autoComplete="off"
    />
  );
}
