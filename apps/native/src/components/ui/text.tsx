import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { useColors } from "@/theme/theme-provider";
import { TYPE } from "@/theme/tokens";

export type TextVariant = keyof typeof TYPE;

export type TextTone =
  | "default"
  | "secondary"
  | "muted"
  | "destructive"
  | "success"
  | "warning"
  | "link"
  | "onPrimary";

/**
 * Type is sentence case now. The `uppercase` + wide-tracking treatment that used
 * to ride every heading, button and label is gone; the one survivor is the
 * **eyebrow** — a small label over a figure — which is why it is also the only
 * variant that folds its own casing.
 *
 * `text-primary` is not a text colour — it is the brand surface — so a link
 * reads `link` and the softer body ink is `secondary`.
 */
export function Text({
  variant = "body",
  tone = "default",
  style,
  children,
  ...props
}: RNTextProps & { variant?: TextVariant; tone?: TextTone }) {
  const colors = useColors();

  const color =
    tone === "secondary"
      ? colors.contentSecondary
      : tone === "muted"
        ? colors.mutedForeground
        : tone === "destructive"
          ? colors.destructive
          : tone === "success"
            ? colors.success
            : tone === "warning"
              ? colors.warning
              : tone === "link"
                ? colors.link
                : tone === "onPrimary"
                  ? colors.primaryForeground
                  : colors.foreground;

  const content =
    variant === "eyebrow" && typeof children === "string"
      ? children.toUpperCase()
      : children;

  return (
    <RNText style={[TYPE[variant], { color }, style]} {...props}>
      {content}
    </RNText>
  );
}
