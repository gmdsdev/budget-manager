import { RefreshControl, ScrollView, View, type ViewStyle } from "react-native";

import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

/**
 * The page shell. Horizontal padding is not optional: without it text sits flush
 * against the screen edge on a phone.
 *
 * It pays **no safe-area inset of its own** — `contentInsetAdjustmentBehavior` hands
 * that to iOS, which knows where the bars are. Both are native and both are
 * translucent, so content has to scroll *under* them while still starting below them,
 * and only the platform can reconcile that.
 *
 * It has to be asked for explicitly. A tab screen gets the adjustment from the native
 * tab host for free, but a pushed screen does not, and a transparent navigation bar
 * contributes no layout height — so wallets, cards, categories and settings each lost
 * the top of their content behind the glass until this was set.
 */
export function Screen({
  children,
  onRefresh,
  refreshing,
  contentStyle,
}: {
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: ViewStyle;
}) {
  const colors = useColors();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.foreground}
            colors={[colors.foreground]}
          />
        ) : undefined
      }
      contentContainerStyle={[
        {
          paddingHorizontal: SPACING.lg,
          paddingBottom: SPACING.xl,
          gap: SPACING.lg,
        },
        contentStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}

/** Page headers stack: a title, then whatever creates a row on this screen. */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={{ gap: SPACING.md, paddingTop: SPACING.lg }}>
      <View style={{ gap: 4 }}>
        <Text variant="pageTitle">{title}</Text>
        {description ? (
          <Text variant="meta" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/**
 * Refetching holds the previous render at reduced opacity rather than dropping
 * back to skeletons, so changing a month or a filter never jumps the page.
 */
export function Fading({
  isFetching,
  children,
  style,
}: {
  isFetching?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[{ opacity: isFetching ? 0.6 : 1 }, style]}>{children}</View>;
}
