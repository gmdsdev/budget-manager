import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  View,
  type ViewStyle,
} from "react-native";

import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, CONTROL_HEIGHT, SHADOW_OFFSET, SPACING } from "@/theme/tokens";

export type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive";

export type ButtonSize = "default" | "sm" | "icon";

/**
 * A pressable plate. The press effect is the web's own — the surface shifts by
 * its shadow offset and the shadow disappears, so the button reads as being
 * pushed into the page. `ghost` opts out, exactly as `buttonVariants` does.
 */
export function Button({
  variant = "default",
  size = "default",
  label,
  loading = false,
  leading,
  disabled,
  style,
  onPress,
  ...props
}: Omit<PressableProps, "children" | "style"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label?: string;
  loading?: boolean;
  leading?: React.ReactNode;
  style?: ViewStyle;
}) {
  const colors = useColors();
  const offset = variant === "ghost" ? 0 : SHADOW_OFFSET.xs;
  const isDisabled = disabled || loading;

  const background =
    variant === "default"
      ? colors.primary
      : variant === "secondary"
        ? colors.secondary
        : variant === "destructive"
          ? colors.destructive
          : variant === "ghost"
            ? "transparent"
            : colors.card;

  const tone =
    variant === "default" || variant === "destructive" ? "inverse" : "default";

  const height = size === "sm" ? 36 : CONTROL_HEIGHT;
  const paddingHorizontal =
    size === "icon" ? 0 : size === "sm" ? SPACING.md : SPACING.lg;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: height,
          opacity: isDisabled ? 0.5 : 1,
          justifyContent: "center",
        },
        size === "icon" && { width: height },
        style,
        // The plate slides into its own shadow rather than fading.
        pressed && offset > 0 ? { transform: [{ translateX: offset }, { translateY: offset }] } : null,
      ]}
      {...props}
    >
      {({ pressed }) => (
        <View style={{ flex: 1, justifyContent: "center" }}>
          {offset > 0 && !pressed && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: offset,
                top: offset,
                right: -offset,
                bottom: -offset,
                backgroundColor: colors.shadowHard,
              }}
            />
          )}
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: SPACING.sm,
              paddingHorizontal,
              borderWidth: variant === "ghost" ? 0 : BORDER_WIDTH,
              borderColor: colors.border,
              backgroundColor: background,
            }}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={tone === "inverse" ? colors.primaryForeground : colors.foreground}
              />
            ) : (
              leading
            )}
            {label ? (
              <Text variant="label" tone={tone} numberOfLines={1}>
                {label}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}
