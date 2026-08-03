import { TextInput, type TextInputProps } from "react-native";

import { useColors } from "@/theme/theme-provider";
import {
  BORDER_WIDTH,
  CONTROL_HEIGHT,
  FONTS,
  RADIUS,
  SPACING,
} from "@/theme/tokens";

/**
 * 16px text in a 48pt box: Wise's everyday control, which already clears the touch
 * minimum, so there is no second scale for a wider screen. `invalid` paints the
 * edge rather than adding a second signal — the message under the field is the
 * message.
 */
export function Input({
  invalid,
  style,
  ...props
}: TextInputProps & { invalid?: boolean }) {
  const colors = useColors();

  return (
    <TextInput
      placeholderTextColor={colors.mutedForeground}
      style={[
        {
          minHeight: CONTROL_HEIGHT.default,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          borderRadius: RADIUS.md,
          borderWidth: BORDER_WIDTH,
          borderColor: invalid ? colors.destructive : colors.input,
          backgroundColor: colors.card,
          color: colors.foreground,
          fontFamily: FONTS.regular,
          fontSize: 16,
        },
        style,
      ]}
      {...props}
    />
  );
}

export function Textarea({
  invalid,
  style,
  ...props
}: TextInputProps & { invalid?: boolean }) {
  return (
    <Input
      multiline
      numberOfLines={3}
      textAlignVertical="top"
      invalid={invalid}
      style={[{ minHeight: 96 }, style]}
      {...props}
    />
  );
}
