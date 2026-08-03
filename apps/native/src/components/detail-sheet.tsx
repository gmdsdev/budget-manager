import { View } from "react-native";

import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, SPACING } from "@/theme/tokens";

/**
 * The shell every record's detail view shares: the lead figure, the fields, then
 * the actions. Five screens open one of these, and stating the layout once is what
 * keeps a wallet's detail view reading like a transaction's.
 *
 * A nested sheet **replaces** this one rather than stacking on it — two modals
 * deep, the back gesture becomes ambiguous and the scrim doubles up — which is why
 * the caller derives `open` from its own nested-sheet state rather than owning a
 * boolean. It also has to stay mounted while a nested sheet is up, or the
 * component holding that sheet unmounts before it can render.
 */
export function DetailSheet({
  open,
  onOpenChange,
  title,
  description,
  amount,
  negative = false,
  children,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** The one figure the record is about, set large. Omitted when it has none. */
  amount?: string;
  negative?: boolean;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <Sheet
      open={open}
      onClose={() => onOpenChange(false)}
      title={title}
      description={description}
    >
      {amount ? (
        <Text
          variant="figureTile"
          tone={negative ? "destructive" : "default"}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {amount}
        </Text>
      ) : null}

      <View>{children}</View>

      <View style={{ gap: SPACING.sm }}>{actions}</View>
    </Sheet>
  );
}

export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const colors = useColors();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderTopWidth: BORDER_WIDTH,
        borderColor: colors.border,
      }}
    >
      <Text variant="meta" tone="muted">
        {label}
      </Text>
      <View style={{ flex: 1, alignItems: "flex-end", minWidth: 0 }}>
        {typeof children === "string" ? (
          <Text variant="metaMedium" numberOfLines={2}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}
