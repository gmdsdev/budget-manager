import { View } from "react-native";

import { Amount } from "@/components/amount";
import { Plate } from "@/components/ui/plate";
import { Swatch } from "@/components/ui/swatch";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/theme/tokens";

/**
 * A figure with its own hint. Stat-tile figures wear ink, not a series colour — only
 * a negative amount takes the destructive tone, and a small swatch next to the label
 * is what ties Income and Expenses to their bars.
 *
 * Full width, one per row: paired into a two-column grid the tile is ~150pt wide, which
 * is narrower than the figure it exists to show — `R$ 121.293,98` broke across three
 * lines, and the ragged column heights left the shadow plate showing as bare ink under
 * every shorter tile. A figure that has to be read in fragments is not a stat tile.
 */
export function StatTile({
  label,
  amountCents,
  currencyCode,
  hint,
  swatch,
  lead = false,
  children,
}: {
  label: string;
  amountCents: number;
  currencyCode: string;
  hint?: string;
  /** A series colour, when the figure also appears as a mark in a chart. */
  swatch?: string;
  /** The figure the section leads with, set larger than the rest. */
  lead?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Plate contentStyle={{ padding: SPACING.md, gap: SPACING.xs }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs }}>
        {swatch ? <Swatch color={swatch} size={8} /> : null}
        <Text variant="tiny" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
          {label.toUpperCase()}
        </Text>
      </View>

      <Amount
        cents={amountCents}
        currencyCode={currencyCode}
        variant={lead ? "figureLead" : "figure"}
      />

      {hint ? (
        <Text variant="tiny" tone="muted">
          {hint}
        </Text>
      ) : null}

      {children}
    </Plate>
  );
}
