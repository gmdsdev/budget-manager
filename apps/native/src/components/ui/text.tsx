import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { useColors } from "@/theme/theme-provider";
import { TYPE } from "@/theme/tokens";

export type TextVariant = keyof typeof TYPE;

export type TextTone =
  | "default"
  | "muted"
  | "destructive"
  | "success"
  | "warning"
  | "inverse";

/**
 * Headings, buttons, labels and table headers are bold uppercase with tracking,
 * which is the design's own grammar — so the casing rides the variant rather
 * than being remembered at each call site.
 */
const UPPERCASE: readonly TextVariant[] = ["h1", "h2", "h3", "label"];

export function Text({
  variant = "body",
  tone = "default",
  style,
  children,
  ...props
}: RNTextProps & { variant?: TextVariant; tone?: TextTone }) {
  const colors = useColors();

  const color =
    tone === "muted"
      ? colors.mutedForeground
      : tone === "destructive"
        ? colors.destructive
        : tone === "success"
          ? colors.success
          : tone === "warning"
            ? colors.warning
            : tone === "inverse"
              ? colors.primaryForeground
              : colors.foreground;

  const content =
    UPPERCASE.includes(variant) && typeof children === "string"
      ? children.toUpperCase()
      : children;

  return (
    <RNText style={[TYPE[variant], { color }, style]} {...props}>
      {content}
    </RNText>
  );
}
