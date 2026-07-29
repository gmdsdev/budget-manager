"use client";

import * as React from "react";

import { Input } from "./input";

function formatFromCents(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseToCents(value: string) {
  const digits = value.replace(/\D/g, "");

  return digits === "" ? 0 : Number(digits);
}

export function CurrencyInput({
  value,
  onChange,
  onBlur,
  className,
  placeholder = "0.00",
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: number;
  onChange: (value: number) => void;
}) {
  const [displayValue, setDisplayValue] = React.useState(() =>
    formatFromCents(value),
  );

  const lastEmitted = React.useRef(value);

  React.useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setDisplayValue(formatFromCents(value));
    }
  }, [value]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;

    const cents = parseToCents(input.value);
    const formatted = formatFromCents(cents);

    lastEmitted.current = cents;
    setDisplayValue(formatted);
    onChange(cents);

    requestAnimationFrame(() => {
      const position = formatted.length;
      input.setSelectionRange(position, position);
    });
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-muted-foreground">
        $
      </span>

      <Input
        {...props}
        value={displayValue}
        onChange={handleChange}
        onBlur={onBlur}
        inputMode="numeric"
        placeholder={placeholder}
        className={["pl-5", className].filter(Boolean).join(" ")}
      />
    </div>
  );
}
