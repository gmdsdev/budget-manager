import * as React from "react";

import { nextCurrencyValue } from "@budget-manager/client";
import { formatMinorUnits } from "@budget-manager/money";
import { Input } from "./input";

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

/**
 * Reads and writes integer **minor units**, the way a card machine reads a
 * keypad: `nextCurrencyValue` (`@budget-manager/client`) turns the text the
 * field holds into the next value, so the phone cannot read a keystroke
 * differently from the browser. What is left here is the caret, which is pinned
 * past the last character — digits shift in from the right, so there is nowhere
 * else for it to be, and arrows, Home and End have nothing to do. Shift and
 * Cmd+A are left alone so the field can still be selected and cleared, and
 * nothing keys off focus: the browser's own select-all-on-tab and Playwright's
 * `fill()` both select *before* they focus, so collapsing the caret there would
 * turn every replacement into an append.
 */
export function CurrencyInput({
  value,
  onValueChange,
  currencyCode,
  allowNegative = false,
  maxValue,
  onMouseUp,
  onKeyDown,
  ...props
}: CurrencyInputProps) {
  const display = formatMinorUnits(value, currencyCode);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const element = event.currentTarget;
    const next = nextCurrencyValue({
      typed: element.value,
      value,
      currencyCode,
      allowNegative,
      maxValue,
    });

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
