import { View, type ViewProps } from "react-native";

import { useTheme } from "@/theme/theme-provider";
import { BORDER_WIDTH, RADIUS, SHADOW } from "@/theme/tokens";

/**
 * The plane every card, sheet, popup and listing sits on. Nothing casts a hard
 * shadow any more: in light mode a surface reads as raised by its hairline border
 * alone, and in dark mode it **drops that border** and is separated by its
 * lighter fill instead — the native reading of `dark:border-transparent`.
 *
 * `floating` is the only elevation left, for the things that genuinely sit over
 * the page (a picker popup, a toast). Stating it here is what keeps a card on one
 * screen from acquiring a shadow a card on another does not have.
 */
export function Surface({
  radius = "xl",
  fill = "card",
  floating = false,
  bordered = true,
  style,
  children,
  ...props
}: ViewProps & {
  radius?: keyof typeof RADIUS;
  fill?: "card" | "background" | "muted" | "accent" | "none";
  floating?: boolean;
  bordered?: boolean;
}) {
  const { mode, colors } = useTheme();

  const backgroundColor =
    fill === "none"
      ? undefined
      : fill === "card"
        ? colors.card
        : fill === "background"
          ? colors.background
          : fill === "muted"
            ? colors.muted
            : colors.accent;

  return (
    <View
      style={[
        {
          borderRadius: RADIUS[radius],
          borderWidth: bordered ? BORDER_WIDTH : 0,
          borderColor:
            bordered && mode === "light" ? colors.border : "transparent",
          backgroundColor,
        },
        floating ? SHADOW.menu[mode] : null,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
