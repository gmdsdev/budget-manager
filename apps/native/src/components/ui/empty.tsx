import { View } from "react-native";

import { Plate } from "@/components/ui/plate";
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
    <Plate
      contentStyle={{
        padding: SPACING.xl,
        gap: SPACING.md,
        alignItems: "center",
      }}
    >
      <Text variant="h3" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {description ? (
        <Text variant="small" tone="muted" style={{ textAlign: "center" }}>
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ width: "100%" }}>{action}</View> : null}
    </Plate>
  );
}
