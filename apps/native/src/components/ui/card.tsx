import { View, type ViewStyle } from "react-native";

import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/theme/tokens";

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <Surface style={[{ padding: SPACING.lg, gap: SPACING.md }, style]}>
      {children}
    </Surface>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="cardTitle">{title}</Text>
        {description ? (
          <Text variant="meta" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}
