import { View, type ViewProps, type ViewStyle } from "react-native";

import { useColors } from "@/theme/theme-provider";
import { PLATE_BORDER_WIDTH, SHADOW_OFFSET, type ShadowSize } from "@/theme/tokens";

/**
 * The design's elevation is a hard offset, never a blur: the web casts
 * `4px 4px 0 0 var(--shadow-hard)`. React Native has no cross-platform
 * zero-blur box shadow, so the offset is a plate of ink drawn behind the
 * surface — same geometry, same ink, no approximation with `shadowRadius`.
 *
 * Every plate in the app (card, dialog, picker popup, list) goes through this,
 * which is what keeps the offsets from drifting per screen.
 */
export function Plate({
  shadow = "default",
  surface = "card",
  style,
  contentStyle,
  children,
  ...props
}: ViewProps & {
  shadow?: ShadowSize | "none";
  /** Which token fills the plate. `none` leaves it transparent. */
  surface?: "card" | "background" | "muted" | "accent" | "none";
  contentStyle?: ViewStyle;
}) {
  const colors = useColors();
  const offset = shadow === "none" ? 0 : SHADOW_OFFSET[shadow];

  const backgroundColor =
    surface === "none"
      ? undefined
      : surface === "card"
        ? colors.card
        : surface === "background"
          ? colors.background
          : surface === "muted"
            ? colors.muted
            : colors.accent;

  return (
    <View style={style} {...props}>
      {offset > 0 && (
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
        style={[
          {
            borderWidth: PLATE_BORDER_WIDTH,
            borderColor: colors.border,
            backgroundColor,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
