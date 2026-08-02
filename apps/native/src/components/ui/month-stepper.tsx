import { Feather } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, CONTROL_HEIGHT, SPACING } from "@/theme/tokens";

/**
 * The month control the dashboard and the budget screen both sit under. The label
 * takes the slack so the two arrows stay at the edges, where thumbs are.
 */
export function MonthStepper({
  label,
  onPrevious,
  onNext,
  previousLabel,
  nextLabel,
  nextDisabled,
}: {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  previousLabel: string;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  const colors = useColors();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
      <Arrow
        icon="chevron-left"
        label={previousLabel}
        onPress={onPrevious}
        color={colors.foreground}
        borderColor={colors.border}
        background={colors.card}
      />
      <Text
        variant="bodyMedium"
        style={{ flex: 1, textAlign: "center", fontVariant: ["tabular-nums"] }}
      >
        {label}
      </Text>
      <Arrow
        icon="chevron-right"
        label={nextLabel}
        onPress={onNext}
        disabled={nextDisabled}
        color={colors.foreground}
        borderColor={colors.border}
        background={colors.card}
      />
    </View>
  );
}

function Arrow({
  icon,
  label,
  onPress,
  disabled,
  color,
  borderColor,
  background,
}: {
  icon: "chevron-left" | "chevron-right";
  label: string;
  onPress: () => void;
  disabled?: boolean;
  color: string;
  borderColor: string;
  background: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        width: CONTROL_HEIGHT,
        height: CONTROL_HEIGHT,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: BORDER_WIDTH,
        borderColor,
        backgroundColor: background,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Feather name={icon} size={18} color={color} />
    </Pressable>
  );
}
