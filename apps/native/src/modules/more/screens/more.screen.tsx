import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { KivoLockup } from "@/components/logo";
import { Plate } from "@/components/ui/plate";
import { PageHeader, Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, CONTROL_HEIGHT, SPACING } from "@/theme/tokens";

/**
 * The destinations that do not earn a tab. The web's sidebar carries all seven; a
 * phone's tab bar holds four comfortably, so the account-shaped screens live one tap
 * deeper rather than crammed into a bar nobody can hit.
 */
const LINKS = [
  { to: "/credit-card", label: "nav.creditCards", icon: "credit-card" },
  { to: "/category", label: "nav.categories", icon: "tag" },
  { to: "/settings", label: "nav.settings", icon: "settings" },
] as const;

export function MoreScreen() {
  const t = useTranslate();
  const colors = useColors();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  return (
    <Screen>
      <PageHeader title={t("common.menu")} />

      <Plate contentStyle={{ padding: SPACING.lg, gap: SPACING.sm }}>
        <KivoLockup height={36} />
        {session ? (
          <Text variant="tiny" tone="muted">
            {session.user.email}
          </Text>
        ) : null}
      </Plate>

      <Plate>
        {LINKS.map((link, index) => (
          <Pressable
            key={link.to}
            accessibilityRole="button"
            onPress={() => router.push(link.to)}
            style={{
              minHeight: CONTROL_HEIGHT,
              flexDirection: "row",
              alignItems: "center",
              gap: SPACING.md,
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.md,
              borderTopWidth: index > 0 ? BORDER_WIDTH : 0,
              borderColor: colors.muted,
            }}
          >
            <Feather name={link.icon} size={18} color={colors.foreground} />
            <Text variant="label" style={{ flex: 1 }}>
              {t(link.label)}
            </Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </Plate>

      <View />
    </Screen>
  );
}
