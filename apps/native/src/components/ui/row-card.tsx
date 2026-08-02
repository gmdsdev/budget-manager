import { View } from "react-native";

import { Plate } from "@/components/ui/plate";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, SPACING } from "@/theme/tokens";

export type RowDetail = { label: string; value: React.ReactNode };

/**
 * One card per row, which is what a listing is on a phone. The web derives the
 * same shape from its `ColumnMeta` slots — `primary` heads the card, `trailing`
 * sits opposite it, `actions` is the row menu, and everything else becomes a
 * labelled line — so a column added there and a detail added here read the same.
 */
export function RowCard({
  primary,
  trailing,
  actions,
  details,
}: {
  primary: React.ReactNode;
  trailing?: React.ReactNode;
  actions?: React.ReactNode;
  details?: RowDetail[];
}) {
  return (
    <View style={{ gap: SPACING.sm, padding: SPACING.md }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm }}>
        <View style={{ flex: 1, minWidth: 0 }}>{primary}</View>
        {trailing ? <View>{trailing}</View> : null}
        {actions ? <View style={{ marginTop: -4, marginRight: -4 }}>{actions}</View> : null}
      </View>

      {details && details.length > 0 ? (
        <View style={{ gap: 2 }}>
          {details.map((detail) => (
            <View
              key={detail.label}
              style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md }}
            >
              <Text variant="tiny" tone="muted" style={{ flex: 1 }}>
                {detail.label}
              </Text>
              <View style={{ maxWidth: "62%", alignItems: "flex-end" }}>
                {typeof detail.value === "string" ? (
                  <Text variant="tiny">{detail.value}</Text>
                ) : (
                  detail.value
                )}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * The plate a list of rows sits on, with hairline separators between them —
 * the native reading of the web's `divide-y` table body.
 */
export function RowCardList({ children }: { children: React.ReactNode[] }) {
  const colors = useColors();

  return (
    <Plate>
      {children.map((child, index) => (
        <View
          key={index}
          style={
            index > 0
              ? { borderTopWidth: BORDER_WIDTH, borderColor: colors.muted }
              : undefined
          }
        >
          {child}
        </View>
      ))}
    </Plate>
  );
}

/** A shared header above consecutive rows — the ledger groups by date. */
export function RowGroupHeader({ label }: { label: string }) {
  const colors = useColors();

  return (
    <View
      style={{
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: colors.muted,
      }}
    >
      <Text variant="tiny" style={{ letterSpacing: 1 }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}
