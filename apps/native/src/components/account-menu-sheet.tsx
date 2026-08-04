import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { InteractionManager, Pressable, View } from "react-native";

import { AccountAvatar } from "@/components/account-avatar";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { useSignOut } from "@/hooks/use-sign-out";
import { authClient } from "@/lib/auth-client";
import { useColors } from "@/theme/theme-provider";
import { CONTROL_HEIGHT, RADIUS, SPACING } from "@/theme/tokens";

/**
 * Everything that does not earn a tab. Three destinations are used every day and get
 * one each; wallets, cards, categories and settings are things you visit to set
 * something up, so they live behind the account mark rather than competing for the
 * bar — which is what keeps every tab hittable instead of merely present.
 *
 * This replaced a **More** tab: a tab whose only job is to list other screens spends
 * a fifth of the bar on navigation about navigation.
 */
const LINKS = [
  { to: "/wallet", label: "nav.wallets", icon: "credit-card" },
  { to: "/credit-card", label: "nav.creditCards", icon: "credit-card" },
  { to: "/category", label: "nav.categories", icon: "tag" },
  { to: "/settings", label: "nav.settings", icon: "settings" },
] as const;

/**
 * The account mark, as `headerLeft` on the stack screen holding the tab group. It sits
 * in a real `UINavigationBar` rather than a bar this app draws, which is what gets it
 * the system material — and it is declared once for all three tabs.
 */
export function AccountMenuButton() {
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const { data: session } = authClient.useSession();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.menu")}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => ({
          borderRadius: RADIUS.full,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <AccountAvatar name={session?.user.name ?? ""} />
      </Pressable>

      <AccountMenuSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function AccountMenuSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslate();
  const colors = useColors();
  const router = useRouter();
  const signOut = useSignOut();
  const { data: session } = authClient.useSession();
  const name = session?.user.name ?? "";

  function go(to: (typeof LINKS)[number]["to"]) {
    onClose();
    // Dismissing this sheet and pushing a screen in the same frame is the case iOS
    // drops on the floor, exactly as it does with a sheet opening a sheet.
    void InteractionManager.runAfterInteractions(() => router.push(to));
  }

  return (
    <Sheet open={open} onClose={onClose} title={t("common.menu")}>
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md }}
      >
        <AccountAvatar name={name} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="bodySemibold" numberOfLines={1}>
            {name}
          </Text>
          {session ? (
            <Text variant="meta" tone="muted" numberOfLines={1}>
              {session.user.email}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ gap: 2 }}>
        {LINKS.map((link) => (
          <Pressable
            key={link.to}
            accessibilityRole="button"
            onPress={() => go(link.to)}
            style={({ pressed }) => ({
              minHeight: CONTROL_HEIGHT.default,
              flexDirection: "row",
              alignItems: "center",
              gap: SPACING.md,
              paddingHorizontal: SPACING.md,
              borderRadius: RADIUS.lg,
              backgroundColor: pressed ? colors.accent : "transparent",
            })}
          >
            <Feather name={link.icon} size={20} color={colors.foreground} />
            <Text variant="bodyMedium" style={{ flex: 1 }}>
              {t(link.label)}
            </Text>
            <Feather
              name="chevron-right"
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>
        ))}
      </View>

      <Button
        variant="destructive"
        label={t("nav.signOut")}
        onPress={() => {
          onClose();
          signOut();
        }}
      />
    </Sheet>
  );
}
