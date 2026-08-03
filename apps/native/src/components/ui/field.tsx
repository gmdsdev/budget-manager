import { View, type ViewStyle } from "react-native";

import { Text } from "@/components/ui/text";
import { SPACING } from "@/theme/tokens";

export function FieldGroup({ children }: { children: React.ReactNode }) {
  return <View style={{ gap: SPACING.lg }}>{children}</View>;
}

/**
 * Two fields side by side. The design pairs Amount|Date and Wallet|Category so a
 * form reads in rows rather than as one long column; on a narrow phone the pair
 * stacks, which is what `wrap` gives without a breakpoint to branch on.
 */
export function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", gap: SPACING.md, flexWrap: "wrap" }}>
      {children}
    </View>
  );
}

export function Field({
  label,
  description,
  errors,
  style,
  children,
}: {
  label?: string;
  description?: string;
  /** Already gated on the field being touched by the caller. */
  errors?: readonly { message?: string }[];
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const message = errors?.find((error) => error?.message)?.message;

  return (
    <View style={[{ gap: SPACING.sm, flexGrow: 1, flexBasis: 140 }, style]}>
      {label ? (
        <Text variant="metaMedium" tone="secondary">
          {label}
        </Text>
      ) : null}
      {children}
      {description ? (
        <Text variant="meta" tone="muted">
          {description}
        </Text>
      ) : null}
      {message ? (
        <Text variant="meta" tone="destructive">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
