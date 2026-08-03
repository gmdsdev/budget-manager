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

import { IconButton } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, RADIUS, SPACING } from "@/theme/tokens";

/**
 * The native stand-in for a dialog: a surface that rises from the bottom edge,
 * where a thumb is. Everything the web puts in a `Dialog` — a form, a picker, a
 * confirmation, a detail view — comes through here, so the corner radius, the
 * scrim and the close affordance are described once.
 *
 * `Modal` rather than an overlay inside the tree, so a sheet opened from a row is
 * not clipped by the list it came from.
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
          style={{ position: "absolute", inset: 0, backgroundColor: "#00000080" }}
        />

        <View
          style={{
            maxHeight: "92%",
            borderTopLeftRadius: RADIUS.xl,
            borderTopRightRadius: RADIUS.xl,
            backgroundColor: colors.card,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: SPACING.sm,
              paddingHorizontal: SPACING.lg,
              paddingTop: SPACING.lg,
            }}
          >
            <View style={{ flex: 1, gap: SPACING.xs }}>
              <Text variant="sheetTitle">{title}</Text>
              {description ? (
                <Text variant="meta" tone="muted">
                  {description}
                </Text>
              ) : null}
            </View>
            <IconButton label={t("common.close")} onPress={onClose}>
              <Feather name="x" size={20} color={colors.foreground} />
            </IconButton>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: SPACING.lg,
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
                borderTopWidth: BORDER_WIDTH,
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
