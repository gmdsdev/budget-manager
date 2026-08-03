import { Feather } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import {
  BORDER_WIDTH,
  CONTROL_HEIGHT,
  RADIUS,
  SPACING,
} from "@/theme/tokens";

export function Checkbox({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => onCheckedChange(!checked)}
      style={{
        minHeight: CONTROL_HEIGHT.default,
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.md,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: RADIUS.sm,
          borderWidth: BORDER_WIDTH,
          borderColor: checked ? "transparent" : colors.input,
          backgroundColor: checked ? colors.primary : colors.card,
        }}
      >
        {checked ? (
          <Feather name="check" size={14} color={colors.primaryForeground} />
        ) : null}
      </View>
      <Text variant="metaMedium" style={{ flex: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}
