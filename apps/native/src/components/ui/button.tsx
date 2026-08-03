import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  View,
  type ViewStyle,
} from "react-native";

import { Text, type TextVariant } from "@/components/ui/text";
import { withAlpha } from "@/theme/color";
import { useColors } from "@/theme/theme-provider";
import {
  BORDER_WIDTH,
  BRAND,
  CONTROL_HEIGHT,
  RADIUS,
  SPACING,
} from "@/theme/tokens";

export type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link"
  | "onBrand"
  | "ghostOnBrand";

export type ButtonSize = "default" | "sm" | "xs" | "lg" | "icon" | "icon-sm";

const PADDING: Record<ButtonSize, number> = {
  default: SPACING.xl,
  sm: SPACING.lg,
  xs: SPACING.md,
  lg: SPACING["2xl"],
  icon: 0,
  "icon-sm": 0,
};

const LABEL_VARIANT: Record<ButtonSize, TextVariant> = {
  default: "bodySemibold",
  sm: "metaMedium",
  xs: "tag",
  lg: "bodySemibold",
  icon: "bodySemibold",
  "icon-sm": "metaMedium",
};

function heightFor(size: ButtonSize) {
  if (size === "lg") return CONTROL_HEIGHT.lg;
  if (size === "sm" || size === "icon-sm") return CONTROL_HEIGHT.sm;
  if (size === "xs") return CONTROL_HEIGHT.xs;

  return CONTROL_HEIGHT.default;
}

/**
 * A pill. Nothing casts a hard shadow any more, so the press effect is a plain
 * wash rather than the surface sliding into its own ink — and `rounded-full` is
 * not a choice a caller makes, it is what a button is in this design.
 *
 * `default` is the brand surface, not a themed one: bright green with forest
 * green ink in **both** modes. `destructive` is outlined rather than a filled red
 * block, and `onBrand`/`ghostOnBrand` are for the dashboard hero, where the
 * page's own primary is the background and would vanish.
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
  const isDisabled = disabled || loading;
  const height = heightFor(size);
  const isIcon = size === "icon" || size === "icon-sm";

  const background =
    variant === "default"
      ? colors.primary
      : variant === "secondary"
        ? colors.secondary
        : variant === "onBrand"
          ? BRAND.forestGreen
          : variant === "ghostOnBrand"
            ? withAlpha(BRAND.forestGreen, 0.08)
            : "transparent";

  const pressedBackground =
    variant === "default"
      ? colors.primaryHover
      : variant === "secondary"
        ? withAlpha(colors.secondary, 0.7)
        : variant === "onBrand"
          ? withAlpha(BRAND.forestGreen, 0.85)
          : variant === "ghostOnBrand"
            ? withAlpha(BRAND.forestGreen, 0.14)
            : variant === "destructive"
              ? withAlpha(colors.destructive, 0.1)
              : variant === "link"
                ? "transparent"
                : colors.accent;

  const borderColor =
    variant === "outline"
      ? colors.input
      : variant === "destructive"
        ? withAlpha(colors.destructive, 0.4)
        : variant === "ghostOnBrand"
          ? withAlpha(BRAND.forestGreen, 0.25)
          : "transparent";

  const tone =
    variant === "default"
      ? ("onPrimary" as const)
      : variant === "destructive"
        ? ("destructive" as const)
        : variant === "link"
          ? ("link" as const)
          : ("default" as const);

  const inkColor =
    variant === "default"
      ? colors.primaryForeground
      : variant === "secondary"
        ? colors.secondaryForeground
        : variant === "destructive"
          ? colors.destructive
          : variant === "link"
            ? colors.link
            : variant === "onBrand"
              ? BRAND.brightGreen
              : variant === "ghostOnBrand"
                ? BRAND.forestGreen
                : colors.foreground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: height,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: SPACING.sm,
          paddingHorizontal: PADDING[size],
          borderRadius: RADIUS.full,
          borderWidth: BORDER_WIDTH,
          borderColor,
          backgroundColor: pressed ? pressedBackground : background,
          opacity: isDisabled ? 0.4 : 1,
        },
        isIcon && { width: height, paddingHorizontal: 0 },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={inkColor} />
      ) : (
        leading
      )}
      {label ? (
        <Text
          variant={LABEL_VARIANT[size]}
          tone={tone}
          numberOfLines={1}
          // The two branded variants ink themselves rather than adding two tones
          // to `Text` that only this file would ever pass.
          style={
            variant === "onBrand" || variant === "ghostOnBrand"
              ? { color: inkColor }
              : undefined
          }
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

/**
 * A row of icon-only affordances needs the tap target without the pill: the
 * sheet close button, a stepper arrow. Same geometry, no fill.
 */
export function IconButton({
  label,
  onPress,
  disabled,
  children,
  size = "sm",
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  size?: "sm" | "default";
  style?: ViewStyle;
}) {
  const colors = useColors();
  const height = size === "sm" ? CONTROL_HEIGHT.sm : CONTROL_HEIGHT.default;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        {
          width: height,
          height,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: RADIUS.full,
          backgroundColor: pressed ? colors.accent : "transparent",
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <View>{children}</View>
    </Pressable>
  );
}
