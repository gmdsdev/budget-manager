import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { withAlpha } from "@/theme/color";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, RADIUS, SPACING } from "@/theme/tokens";

/**
 * One row of a listing, shared by every screen that shows records: the ledger,
 * wallets, cards, budgets, categories and the dashboard's own lists. It is the
 * native twin of `apps/web/src/components/record-row.tsx`, and the shape is
 * Wise's — a rounded, borderless item that only shows its edges on press: a
 * leading glyph, the record's name over a dot-separated meta line, an optional
 * status tag, and the figure opposite.
 *
 * A bordered card around hundreds of rows reads as one undifferentiated block,
 * which is why there is no longer one. And **the whole row is the way in to the
 * record**: none of these listings carries a row menu any more, because a menu in
 * a list of hundreds of rows puts an irreversible action one mis-tap from a
 * reversible one. Every action lives in the detail sheet the row opens.
 */
export function RecordList({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View accessibilityLabel={label} style={{ gap: 2 }}>
      {children}
    </View>
  );
}

export function RecordRow({
  glyph,
  primary,
  meta,
  tag,
  trailing,
  label,
  onSelect,
}: {
  glyph?: React.ReactNode;
  /** The record's name, or whatever names it — a category renders its label. */
  primary: React.ReactNode;
  /** Dot-separated; falsy entries drop out, so a screen can omit a field. */
  meta?: readonly (string | null | undefined | false)[];
  /** A status pill. Sits under the figure, where a phone has room for it. */
  tag?: React.ReactNode;
  trailing?: React.ReactNode;
  label: string;
  /** Omitted where the record has nowhere to open — the row then reads as plain. */
  onSelect?: () => void;
}) {
  const colors = useColors();
  const parts = (meta ?? []).filter((part): part is string => !!part);

  const content = (
    <>
      {glyph}

      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        {typeof primary === "string" ? (
          <Text variant="bodySemibold" numberOfLines={1}>
            {primary}
          </Text>
        ) : (
          primary
        )}
        {parts.length > 0 ? (
          <Text variant="meta" tone="muted" numberOfLines={2}>
            {parts.join(" · ")}
          </Text>
        ) : null}
      </View>

      {/* Capped. The trailing column sizes to its content and would otherwise win
          every argument with the name beside it — a labelled figure like
          "R$ 11.769,11 available" is wider than most record names, so the figure
          stayed whole and the name truncated. Past half the row it wraps instead,
          which is the right thing to lose. */}
      {trailing || tag ? (
        <View style={{ maxWidth: "50%", alignItems: "flex-end", gap: 2 }}>
          {trailing}
          {tag}
        </View>
      ) : null}
    </>
  );

  const layout = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  };

  if (!onSelect) {
    return <View style={layout}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onSelect}
      style={({ pressed }) => [
        layout,
        { backgroundColor: pressed ? colors.accent : "transparent" },
      ]}
    >
      {content}
    </Pressable>
  );
}

/** A circle tinted with the record's own hue, holding an icon. */
export function RecordGlyph({
  color,
  children,
}: {
  /** Falls back to the muted ink when the record has no hue of its own. */
  color?: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  const ink = color ?? colors.mutedForeground;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: RADIUS.full,
        // A hue at full strength behind a dark glyph is unreadable in light mode
        // and shouty in dark, so the fill is a tint of it.
        backgroundColor: withAlpha(ink, colors.glyphTint),
      }}
    >
      {children}
    </View>
  );
}

export type RecordTagTone = "neutral" | "positive" | "warning" | "negative";

/** A status pill. `tone` picks the sentiment wash. */
export function RecordTag({
  tone = "neutral",
  children,
}: {
  tone?: RecordTagTone;
  children: string;
}) {
  const colors = useColors();

  const fill =
    tone === "positive"
      ? colors.successMuted
      : tone === "warning"
        ? colors.warningMuted
        : tone === "negative"
          ? colors.destructiveMuted
          : colors.muted;

  const ink =
    tone === "positive"
      ? colors.success
      : tone === "warning"
        ? colors.warning
        : tone === "negative"
          ? colors.destructive
          : colors.contentSecondary;

  return (
    <View
      style={{
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: RADIUS.full,
        backgroundColor: fill,
      }}
    >
      <Text variant="tag" style={{ color: ink }}>
        {children}
      </Text>
    </View>
  );
}

/**
 * A date stated once and ruled off, rather than repeated on every row. Only the
 * ledger groups, which is why this lives beside the row rather than inside it.
 */
export function RecordGroupHeader({ label }: { label: string }) {
  const colors = useColors();

  return (
    <View
      style={{
        paddingHorizontal: SPACING.sm,
        paddingBottom: SPACING.sm,
        marginBottom: SPACING.xs,
        borderBottomWidth: BORDER_WIDTH,
        borderColor: colors.border,
      }}
    >
      <Text variant="metaMedium" tone="secondary">
        {label}
      </Text>
    </View>
  );
}
