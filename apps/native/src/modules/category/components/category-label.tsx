import type { CategoryColor } from "@budget-manager/schemas";
import { View } from "react-native";

import { Swatch } from "@/components/ui/swatch";
import { Text, type TextVariant } from "@/components/ui/text";
import { categoryColorOrNeutral } from "@/modules/category/colors";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

/**
 * A category's swatch is never the message: twelve hues cannot all stay separable
 * under dichromacy, so the dot always travels with the name and contributes no
 * text of its own.
 */
export function CategoryLabel({
  color,
  name,
  variant = "body",
}: {
  color: CategoryColor | null;
  name: string;
  variant?: TextVariant;
}) {
  const colors = useColors();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm, minWidth: 0 }}>
      <Swatch color={color ? categoryColorOrNeutral(colors, color) : null} />
      <Text variant={variant} numberOfLines={1} style={{ flexShrink: 1 }}>
        {name}
      </Text>
    </View>
  );
}
