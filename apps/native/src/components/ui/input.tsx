import { TextInput, type TextInputProps } from "react-native";

import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, CONTROL_HEIGHT, FONTS, SPACING } from "@/theme/tokens";

/**
 * 16px text and a 44pt box: the control sizes of the app's touch-first layout.
 * `invalid` paints the edge rather than adding a second signal — the message
 * under the field is the message.
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
          minHeight: CONTROL_HEIGHT,
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm,
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
      style={[{ minHeight: 88 }, style]}
      {...props}
    />
  );
}
