import { formatMinorUnits, parseMinorUnits } from "@budget-manager/money";

import { Input } from "@/components/ui/input";

/**
 * Reads and writes integer **minor units** directly — never a float, and never a
 * major-unit string the caller has to convert. The field shows the currency's own
 * formatting and typing shifts digits in from the right, so the decimal point is
 * never something the user has to place: 1, 2, 3 reads as 1,23.
 */
export function CurrencyInput({
  value,
  currencyCode,
  onValueChange,
  onBlur,
  invalid,
  accessibilityLabel,
}: {
  value: number;
  currencyCode: string;
  onValueChange: (value: number) => void;
  onBlur?: () => void;
  invalid?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Input
      // Numeric only: a currency field has no use for a full keyboard, and the
      // separators are the formatter's to place.
      keyboardType="number-pad"
      invalid={invalid}
      accessibilityLabel={accessibilityLabel}
      value={formatMinorUnits(value, currencyCode)}
      onBlur={onBlur}
      onChangeText={(text) => onValueChange(parseMinorUnits(text))}
      style={{ fontVariant: ["tabular-nums"] }}
    />
  );
}
