import * as React from "react";

import { formatMinorUnits, MONEY_MAX_MINOR_UNITS } from "@budget-manager/money";
import { Input } from "./input";

function digitsOf(text: string) {
  return text.replace(/\D/g, "");
}

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

function caretToEnd(element: HTMLInputElement) {
  const end = element.value.length;

  element.setSelectionRange(end, end);
}

const CARET_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

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
  onMouseUp,
  onKeyDown,
  ...props
}: CurrencyInputProps) {
  const display = formatMinorUnits(value, currencyCode);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const element = event.currentTarget;
    const typed = element.value;

    const before = digitsOf(display);
    const after = digitsOf(typed);
    const signChanged =
      allowNegative && typed.includes("-") !== display.includes("-");

    const trimmedSeparator =
      !signChanged &&
      after.length === before.length &&
      isDeletion(typed, display);

    const magnitude = trimmedSeparator
      ? Math.trunc(Number(before || "0") / 10)
      : Number(after || "0");

    const negative = allowNegative && typed.includes("-") && magnitude !== 0;
    const parsed = negative ? -magnitude : magnitude;
    const rejected = magnitude > maxValue || !Number.isSafeInteger(parsed);
    const next = rejected ? value : parsed;

    element.value = formatMinorUnits(next, currencyCode);
    caretToEnd(element);

    if (next !== value) {
      onValueChange(next);
    }
  }

  function handleMouseUp(event: React.MouseEvent<HTMLInputElement>) {
    const element = event.currentTarget;

    if (element.selectionStart === element.selectionEnd) {
      caretToEnd(element);
    }

    onMouseUp?.(event);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (CARET_KEYS.has(event.key) && !event.shiftKey) {
      event.preventDefault();
      caretToEnd(event.currentTarget);
    }

    onKeyDown?.(event);
  }

  return (
    <Input
      {...props}
      value={display}
      onChange={handleChange}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      inputMode={allowNegative ? "text" : "numeric"}
      autoComplete="off"
    />
  );
}
