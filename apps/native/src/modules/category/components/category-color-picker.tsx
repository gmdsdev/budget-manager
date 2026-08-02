import { useEnumLabels } from "@budget-manager/client/react";
import { CATEGORY_COLORS, type CategoryColor } from "@budget-manager/schemas";
import { Pressable, View } from "react-native";

import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, SPACING } from "@/theme/tokens";

/**
 * A grid of the palette rather than a picker sheet: the choice *is* the colour, so
 * hiding the options behind a trigger would make the user open a popup to see what
 * they are picking between. Radios, because exactly one is chosen.
 *
 * Selection reads as a ring against the page rather than as a change of tint, so
 * it holds up on every hue in the palette.
 */
export function CategoryColorPicker({
  value,
  onValueChange,
}: {
  value: CategoryColor;
  onValueChange: (color: CategoryColor) => void;
}) {
  const labels = useEnumLabels();
  const colors = useColors();

  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm }}
    >
      {CATEGORY_COLORS.map((color) => {
        const selected = color === value;

        return (
          <Pressable
            key={color}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={labels.categoryColor(color)}
            onPress={() => onValueChange(color)}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: selected ? 2 : 0,
              borderColor: colors.foreground,
              padding: selected ? 3 : 5,
            }}
          >
            <View
              style={{
                flex: 1,
                width: "100%",
                borderWidth: BORDER_WIDTH,
                borderColor: colors.border,
                backgroundColor: colors.category[color],
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
