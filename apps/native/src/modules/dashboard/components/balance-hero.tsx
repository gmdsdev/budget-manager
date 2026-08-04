import { formatMinorUnits } from "@budget-manager/money";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { BRAND, RADIUS, SPACING } from "@/theme/tokens";

/**
 * The one figure the screen is answering — "how much have I got" — set on the brand
 * plane rather than in the grid of tiles, so the eye lands on it first.
 *
 * It carries no actions: recording something moved to the app bar, where it is
 * reachable from every tab rather than only from the top of this one screen.
 *
 * The panel is always bright green with forest-green ink in both themes: it is the
 * brand surface, not a themed one, which is why the colours are literal here instead
 * of reading the palette.
 */
export function BalanceHero({
  label,
  amountCents,
  currencyCode,
  note,
  splits,
}: {
  label: string;
  amountCents: number;
  currencyCode: string;
  note?: readonly string[];
  splits?: readonly { key: string; label: string; amountCents: number }[];
}) {
  return (
    <View
      style={{
        borderRadius: RADIUS["2xl"],
        backgroundColor: BRAND.brightGreen,
        padding: SPACING.xl,
        gap: SPACING.xl,
      }}
    >
      <View style={{ gap: SPACING.xs }}>
        <Text variant="eyebrow" tone="onPrimary" style={{ opacity: 0.6 }}>
          {label}
        </Text>
        {/* The balance is given 85% of the plane to sit in rather than a smaller
            type step. `figureHero` stays the size the scale says it is, and
            `adjustsFontSizeToFit` shrinks *this* figure only as far as the narrower
            box demands — so a short balance still reads at full size and a long one
            comes down on its own, instead of every account paying for the worst
            case. The margin it leaves is what stops the number touching the edge. */}
        <Text
          variant="figureHero"
          tone="onPrimary"
          adjustsFontSizeToFit
          numberOfLines={1}
          style={{ maxWidth: "85%" }}
        >
          {formatMinorUnits(amountCents, currencyCode)}
        </Text>
        {note?.map((line) => (
          <Text key={line} variant="meta" tone="onPrimary" style={{ opacity: 0.7 }}>
            {line}
          </Text>
        ))}
      </View>

      {splits && splits.length > 0 ? (
        // No wrapping and no basis: an even share of the row, so two splits are two
        // columns and the figures line up. A `flexBasis` wide enough for the longest
        // amount is what pushed the third one onto a row of its own.
        <View style={{ flexDirection: "row", gap: SPACING.lg }}>
          {splits.map((split) => (
            <View key={split.key} style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text
                variant="eyebrow"
                tone="onPrimary"
                numberOfLines={1}
                style={{ opacity: 0.6 }}
              >
                {split.label}
              </Text>
              <Text
                variant="cardTitle"
                tone="onPrimary"
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {formatMinorUnits(split.amountCents, currencyCode)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
