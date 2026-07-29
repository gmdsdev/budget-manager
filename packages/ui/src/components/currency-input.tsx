"use client";

import * as React from "react";

import { Input } from "./input";

function countDigits(value: string) {
  return (value.match(/\d/g) ?? []).length;
}

function sanitize(raw: string) {
  let value = raw.replace(/[^0-9.]/g, "");
  const firstDot = value.indexOf(".");

  if (firstDot !== -1) {
    value =
      value.slice(0, firstDot + 1) +
      value.slice(firstDot + 1).replace(/\./g, "");
  }

  return value;
}

// While typing, decimals are NOT capped to 2 digits — capping here would
// silently swallow a keystroke typed at the end of an already-2-decimal
// value (e.g. "218.06" + "9"), since the new digit would just get sliced
// back off, making it look like the field ignored the input. Instead we
// clean up to 2 decimals on blur, in `roundToCents` below.
function formatDisplay(raw: string) {
  const sanitized = sanitize(raw);
  const [intPart, decPart] = sanitized.split(".");
  const formattedInt = (intPart || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}

function parseNumber(formatted: string) {
  const cleaned = formatted.replace(/,/g, "");

  if (!cleaned || cleaned === ".") {
    return 0;
  }

  const parsed = Number.parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatFromNumber(valueInCents: number) {
  if (!valueInCents) return "";

  return formatDisplay((valueInCents / 100).toString());
}

function roundToCents(value: number) {
  return Math.round(value * 100) / 100;
}

export function CurrencyInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "0.00",
  disabled,
  "aria-invalid": ariaInvalid,
  ...props
}: React.ComponentProps<"input"> & {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
}) {
  const [displayValue, setDisplayValue] = React.useState(() =>
    formatFromNumber(value),
  );
  // Tracks the numeric value we ourselves last emitted via onChange, so the
  // sync-from-prop effect below can never clobber what the user just typed
  // while waiting for that value to round-trip back through the parent form.
  const lastEmitted = React.useRef(value);

  React.useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setDisplayValue(formatFromNumber(value));
    }
  }, [value]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const rawValue = input.value;
    const caret = input.selectionStart ?? rawValue.length;
    const justTypedPunctuation = /[^0-9]/.test(rawValue[caret - 1] ?? "");
    const digitsBeforeCaret = countDigits(rawValue.slice(0, caret));

    const formatted = formatDisplay(rawValue);

    let newCaret = formatted.length;
    let seen = 0;

    if (digitsBeforeCaret === 0) {
      newCaret = 0;
    } else {
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i]!)) {
          seen++;
          if (seen === digitsBeforeCaret) {
            newCaret = i + 1;
            break;
          }
        }
      }
    }

    if (justTypedPunctuation) {
      while (
        newCaret < formatted.length &&
        /[^0-9]/.test(formatted[newCaret]!)
      ) {
        newCaret++;
      }
    }

    const numeric = parseNumber(formatted);
    const cents = Math.round(numeric * 100);

    lastEmitted.current = cents;
    setDisplayValue(formatted);
    onChange(cents);

    // Restore the caret after React re-renders the input with the
    // reformatted value — mutating `input.value` synchronously here would
    // fight React's own controlled-input reconciliation.
    requestAnimationFrame(() => {
      input.setSelectionRange(newCaret, newCaret);
    });
  }

  function handleBlur() {
    const rounded = roundToCents(value / 100);
    const cents = Math.round(rounded * 100);

    if (cents !== value) {
      lastEmitted.current = cents;
      onChange(cents);
    }

    const cleanDisplay = formatFromNumber(cents);

    if (cleanDisplay !== displayValue) {
      setDisplayValue(cleanDisplay);
    }

    onBlur?.();
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-muted-foreground">
        $
      </span>
      <Input
        {...props}
        id={id}
        inputMode="decimal"
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        disabled={disabled}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className="pl-5"
      />
    </div>
  );
}
