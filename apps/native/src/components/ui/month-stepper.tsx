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

/**
 * The month control the dashboard and the budget screen both sit under. The label
 * takes the slack so the two arrows stay at the edges, where thumbs are — and both
 * wear the 36pt chip, the same size as the filter bar's controls.
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
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}
    >
      <Arrow icon="chevron-left" label={previousLabel} onPress={onPrevious} />
      {/* `flexGrow`, not `flex`. `flex: 1` is `flexBasis: 0` in React Native, so the
          label contributes nothing to the row's own intrinsic width — fine when the
          stepper is stretched to a column's full width, but where it is only as wide
          as its content (the dashboard's `space-between` scope row) the month
          collapsed to zero and vanished between the two arrows. */}
      <Text
        variant="metaMedium"
        style={{
          flexGrow: 1,
          textAlign: "center",
          fontVariant: ["tabular-nums"],
        }}
      >
        {label}
      </Text>
      <Arrow
        icon="chevron-right"
        label={nextLabel}
        onPress={onNext}
        disabled={nextDisabled}
      />
    </View>
  );
}

function Arrow({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: "chevron-left" | "chevron-right";
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: CONTROL_HEIGHT.sm,
        height: CONTROL_HEIGHT.sm,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: RADIUS.full,
        borderWidth: BORDER_WIDTH,
        borderColor: colors.input,
        backgroundColor: pressed ? colors.accent : colors.card,
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <Feather name={icon} size={18} color={colors.foreground} />
    </Pressable>
  );
}
