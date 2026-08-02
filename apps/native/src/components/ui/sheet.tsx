import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { PLATE_BORDER_WIDTH, SPACING } from "@/theme/tokens";

/**
 * The native stand-in for a dialog: a plate that rises from the bottom edge,
 * where a thumb is. Everything the web puts in a `Dialog` — a form, a picker, a
 * confirmation — comes through here, so the surface, the ink edge and the close
 * affordance are described once.
 *
 * `Modal` rather than an overlay inside the tree, so a sheet opened from a row
 * menu is not clipped by the list it came from.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const t = useTranslate();

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Without this the keyboard covers the bottom of every form — which is where
          the notes field and the submit button are. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        {/* Tapping the scrim dismisses, the same as the web's overlay. */}
        <Pressable
          accessibilityLabel={t("common.close")}
          onPress={onClose}
          style={{ position: "absolute", inset: 0, backgroundColor: "#00000099" }}
        />

        <View
          style={{
            maxHeight: "92%",
            borderTopWidth: PLATE_BORDER_WIDTH,
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: SPACING.sm,
              borderBottomWidth: PLATE_BORDER_WIDTH,
              borderColor: colors.border,
              padding: SPACING.lg,
            }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="h2">{title}</Text>
              {description ? (
                <Text variant="tiny" tone="muted">
                  {description}
                </Text>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
              onPress={onClose}
              hitSlop={12}
            >
              <Feather name="x" size={20} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: SPACING.lg,
              paddingBottom: SPACING.lg,
              gap: SPACING.lg,
            }}
          >
            {children}
          </ScrollView>

          {footer ? (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: SPACING.sm,
                borderTopWidth: PLATE_BORDER_WIDTH,
                borderColor: colors.border,
                padding: SPACING.lg,
                paddingBottom: SPACING.lg + insets.bottom,
              }}
            >
              {footer}
            </View>
          ) : (
            <View style={{ height: insets.bottom }} />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
