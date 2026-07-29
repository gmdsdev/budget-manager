"use client";

import * as React from "react";

import { Input } from "./input";
import { formatFromCents, parseToCents } from "../lib/currency";

export function CurrencyInput({
  value,
  onChange,
  onBlur,
  className,
  placeholder = "0.00",
  currencyCode = "USD",
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: number;
  onChange: (value: number) => void;
  currencyCode: string;
}) {
  const [displayValue, setDisplayValue] = React.useState(() =>
    formatFromCents(value, currencyCode),
  );

  const lastEmitted = React.useRef({ value, currencyCode });

  React.useEffect(() => {
    if (
      value !== lastEmitted.current.value ||
      currencyCode !== lastEmitted.current.currencyCode
    ) {
      lastEmitted.current = { value, currencyCode };
      setDisplayValue(formatFromCents(value, currencyCode));
    }
  }, [value, currencyCode]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;

    const cents = parseToCents(input.value);
    const formatted = formatFromCents(cents, currencyCode);

    lastEmitted.current = { value: cents, currencyCode };
    setDisplayValue(formatted);
    onChange(cents);

    requestAnimationFrame(() => {
      const position = formatted.length;
      input.setSelectionRange(position, position);
    });
  }

  return (
    <Input
      {...props}
      value={displayValue}
      onChange={handleChange}
      onBlur={onBlur}
      inputMode="numeric"
      placeholder={placeholder}
    />
  );
}
