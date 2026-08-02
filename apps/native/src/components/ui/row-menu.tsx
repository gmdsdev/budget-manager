import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { InteractionManager, Pressable, View } from "react-native";

import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, CONTROL_HEIGHT, SPACING } from "@/theme/tokens";

export type RowAction = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

/**
 * The row menu, as a sheet rather than a dropdown: a popup anchored to a 44pt
 * trigger at the edge of a phone has nowhere to go. Every destructive entry still
 * opens its own confirmation — the sheet is the menu, not the commitment.
 */
export function RowMenu({
  label,
  actions,
}: {
  /** Names *which* row's menu this is, so two rows are distinguishable. */
  label: string;
  actions: RowAction[];
}) {
  const colors = useColors();
  const t = useTranslate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={{
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name="more-horizontal" size={20} color={colors.foreground} />
      </Pressable>

      <Sheet open={open} onClose={() => setOpen(false)} title={t("common.actions")}>
        <View>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityState={{ disabled: !!action.disabled }}
              disabled={action.disabled}
              // The action opens a sheet of its own, and dismissing one modal while
              // presenting another in the same frame is exactly the case iOS drops
              // on the floor — the second sheet never appears. Waiting for this
              // one's dismissal to finish is what makes the next tap land.
              onPress={() => {
                setOpen(false);
                void InteractionManager.runAfterInteractions(action.onPress);
              }}
              style={{
                minHeight: CONTROL_HEIGHT,
                justifyContent: "center",
                paddingHorizontal: SPACING.md,
                borderBottomWidth: BORDER_WIDTH,
                borderColor: colors.muted,
                opacity: action.disabled ? 0.5 : 1,
              }}
            >
              <Text variant="label" tone={action.destructive ? "destructive" : "default"}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Sheet>
    </>
  );
}
