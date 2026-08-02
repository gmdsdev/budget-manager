import { formatMinorUnits } from "@budget-manager/money";

import { Text, type TextVariant } from "@/components/ui/text";

/**
 * Money wears ink, not a series colour — only an amount in the red takes the
 * destructive tone. Amounts are always integer minor units, formatted by the
 * currency rather than by the app's language, so `R$ 1.234,56` reads the same to
 * whoever is looking.
 */
export function Amount({
  cents,
  currencyCode,
  variant = "body",
  signed = false,
  credit = false,
  negativeIsDestructive = true,
}: {
  cents: number;
  currencyCode: string;
  variant?: TextVariant;
  /** Prefixes an explicit + or − , for a ledger row whose direction is the point. */
  signed?: boolean;
  credit?: boolean;
  negativeIsDestructive?: boolean;
}) {
  const formatted = formatMinorUnits(cents, currencyCode);

  return (
    <Text
      variant={variant}
      tone={
        signed && credit
          ? "success"
          : negativeIsDestructive && cents < 0
            ? "destructive"
            : "default"
      }
      style={{ fontVariant: ["tabular-nums"] }}
    >
      {signed ? `${credit ? "+" : "−"}${formatted}` : formatted}
    </Text>
  );
}
