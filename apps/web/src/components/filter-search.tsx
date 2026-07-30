import { Input } from "@budget-manager/ui/components/input";
import { useEffect, useRef, useState } from "react";

export const FILTER_SEARCH_DELAY_MS = 300;

/**
 * A text filter that commits once typing settles. The input owns the keystrokes
 * so every one of them does not become a request — and a reset from outside
 * (Clear filters) is mirrored back into the field. The placeholder carries the
 * column name, so the bar needs no visible label; `label` still labels it for
 * assistive tech.
 */
export function FilterSearch({
  id,
  label,
  value,
  onValueChange,
  placeholder = `Filter by ${label.toLowerCase()}`,
  delay = FILTER_SEARCH_DELAY_MS,
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
}) {
  const [text, setText] = useState(value);
  const previousValue = useRef(value);
  const onValueChangeRef = useRef(onValueChange);

  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  useEffect(() => {
    if (previousValue.current === value) {
      return;
    }

    previousValue.current = value;
    setText(value);
  }, [value]);

  useEffect(() => {
    if (text === value) {
      return;
    }

    const timer = setTimeout(() => onValueChangeRef.current(text), delay);

    return () => clearTimeout(timer);
  }, [text, value, delay]);

  return (
    <Input
      id={id}
      type="search"
      aria-label={label}
      // A whole row on a phone: at half of one the placeholder — which is the
      // only thing naming the column — gets clipped.
      className="col-span-2 w-full sm:col-span-1 sm:w-48"
      autoComplete="off"
      placeholder={placeholder}
      value={text}
      onChange={(event) => setText(event.currentTarget.value)}
    />
  );
}
