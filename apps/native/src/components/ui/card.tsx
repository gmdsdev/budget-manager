import { View, type ViewStyle } from "react-native";

import { Plate } from "@/components/ui/plate";
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
    <Plate style={style} contentStyle={{ padding: SPACING.lg, gap: SPACING.md }}>
      {children}
    </Plate>
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
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="h3">{title}</Text>
        {description ? (
          <Text variant="tiny" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}
