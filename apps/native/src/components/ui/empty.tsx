import { View } from "react-native";

import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/theme/tokens";

export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Surface
      style={{
        padding: SPACING.xl,
        gap: SPACING.md,
        alignItems: "center",
      }}
    >
      <Text variant="cardTitle" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {description ? (
        <Text variant="meta" tone="muted" style={{ textAlign: "center" }}>
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ width: "100%" }}>{action}</View> : null}
    </Surface>
  );
}
