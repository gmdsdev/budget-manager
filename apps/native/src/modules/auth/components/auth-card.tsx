import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KivoLockup } from "@/components/logo";
import { Plate } from "@/components/ui/plate";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

/** The lockup is the brand wherever it fits, and the auth card is one of those. */
export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: SPACING.lg,
          paddingTop: insets.top + SPACING.xl,
          paddingBottom: insets.bottom + SPACING.xl,
        }}
      >
        <Plate contentStyle={{ padding: SPACING.xl, gap: SPACING.xl }}>
          <View style={{ alignItems: "center", gap: SPACING.lg }}>
            <KivoLockup height={44} />
            <Text variant="h1" style={{ textAlign: "center" }}>
              {title}
            </Text>
          </View>
          {children}
        </Plate>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
