import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, View, type ViewStyle } from "react-native";

import { Sheet } from "@/components/ui/sheet";
import { Swatch } from "@/components/ui/swatch";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import {
  BORDER_WIDTH,
  CONTROL_HEIGHT,
  RADIUS,
  SPACING,
} from "@/theme/tokens";

export type SelectItem = {
  label: string;
  value: string;
  /** A resolved colour, or `null` for a row whose swatch is deliberately empty. */
  color?: string | null;
};

/**
 * A trigger plus a sheet of choices. Two behaviours are load-bearing and match
 * the web's primitive rather than being re-invented per form:
 *
 * - **A dependent select empties itself.** Where one field narrows another — the
 *   card payment's statement list is its card's, its wallet list is filtered to
 *   that card's currency — a value that is no longer among `items` is dropped and
 *   the change is reported, so no form has to reset a dependant by hand.
 * - The trigger renders the *placeholder* when nothing is chosen, so a submit is
 *   what tells an unset field from a set one.
 */
export function Select({
  items,
  value,
  onValueChange,
  placeholder,
  disabled,
  invalid,
  label,
  size = "default",
  filled = false,
  style,
}: {
  items: SelectItem[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Names the control for assistive tech; the bar's selects carry no visible label. */
  label?: string;
  /** `sm` is the 36pt chip the filter bar wears; `default` is the 48pt field. */
  size?: "default" | "sm";
  /** The filled state an applied filter takes. */
  filled?: boolean;
  style?: ViewStyle;
}) {
  const colors = useColors();
  const t = useTranslate();
  const [open, setOpen] = useState(false);

  const selected = items.find((item) => item.value === value);
  const isChip = size === "sm";

  useEffect(() => {
    if (value && items.length > 0 && !items.some((item) => item.value === value)) {
      onValueChange("");
    }
  }, [items, value, onValueChange]);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled, expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          {
            minHeight: isChip ? CONTROL_HEIGHT.sm : CONTROL_HEIGHT.default,
            flexDirection: "row",
            alignItems: "center",
            gap: SPACING.sm,
            paddingHorizontal: isChip ? SPACING.lg : SPACING.lg,
            // A chip is a pill; a form field takes the input radius.
            borderRadius: isChip ? RADIUS.full : RADIUS.md,
            borderWidth: BORDER_WIDTH,
            borderColor: invalid
              ? colors.destructive
              : filled
                ? "transparent"
                : colors.input,
            backgroundColor: filled
              ? colors.secondary
              : pressed
                ? colors.accent
                : colors.card,
            opacity: disabled ? 0.4 : 1,
          },
          style,
        ]}
      >
        {selected && selected.color !== undefined ? (
          <Swatch color={selected.color} />
        ) : null}
        <Text
          variant={isChip ? "metaMedium" : "body"}
          tone={selected ? (filled ? "default" : "default") : "muted"}
          numberOfLines={1}
          style={[
            { flex: 1 },
            filled ? { color: colors.secondaryForeground } : null,
          ]}
        >
          {selected?.label ?? placeholder ?? ""}
        </Text>
        <Feather
          name="chevron-down"
          size={16}
          color={filled ? colors.secondaryForeground : colors.mutedForeground}
        />
      </Pressable>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={label ?? placeholder ?? t("common.actions")}
      >
        <View style={{ gap: 2 }}>
          {items.map((item) => {
            const isSelected = item.value === value;

            return (
              <Pressable
                key={item.value}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onValueChange(item.value);
                  setOpen(false);
                }}
                style={({ pressed }) => ({
                  minHeight: CONTROL_HEIGHT.default,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.sm,
                  paddingHorizontal: SPACING.md,
                  borderRadius: RADIUS.md,
                  backgroundColor: isSelected
                    ? colors.secondary
                    : pressed
                      ? colors.accent
                      : "transparent",
                })}
              >
                {/* One row carrying a swatch means every row reserves the space,
                    so the labels stay on one left edge. */}
                {items.some((candidate) => candidate.color !== undefined) ? (
                  item.color === undefined ? (
                    <View style={{ width: 10 }} />
                  ) : (
                    <Swatch color={item.color} />
                  )
                ) : null}
                <Text
                  style={[
                    { flex: 1 },
                    isSelected ? { color: colors.secondaryForeground } : null,
                  ]}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
                {isSelected ? (
                  <Feather
                    name="check"
                    size={16}
                    color={colors.secondaryForeground}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}
