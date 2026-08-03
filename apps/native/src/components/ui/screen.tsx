import { RefreshControl, ScrollView, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

/**
 * The page shell. Horizontal padding is not optional: without it text sits flush
 * against the screen edge on a phone.
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
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
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
          paddingBottom: insets.bottom + SPACING.xl,
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
