import { useTranslate } from "@budget-manager/i18n/react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

export const FILTER_SEARCH_DELAY_MS = 300;

/**
 * A text filter that commits once typing settles. The field owns the keystrokes
 * so every one of them does not become a request — and a reset from outside
 * (`Clear filters`) is mirrored back into it. The placeholder carries the column
 * name, so the bar needs no visible label; `aria-label`'s native counterpart is
 * what names it for assistive tech.
 */
export function FilterSearch({
  label,
  value,
  onValueChange,
  placeholder,
  delay = FILTER_SEARCH_DELAY_MS,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
}) {
  const t = useTranslate();
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
      accessibilityLabel={label}
      autoCorrect={false}
      autoCapitalize="none"
      // A whole row: at half of one the placeholder — the only thing naming the
      // column — gets clipped.
      style={{ width: "100%" }}
      placeholder={placeholder ?? t("common.filterBy", { column: label.toLowerCase() })}
      value={text}
      onChangeText={setText}
    />
  );
}
