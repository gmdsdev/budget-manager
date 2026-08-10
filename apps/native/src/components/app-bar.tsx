import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AccountMenuButton } from "@/components/account-menu-sheet";
import { IconButton } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { CONTROL_HEIGHT, SPACING } from "@/theme/tokens";

/**
 * **Every bar in this app is drawn by this app.** The chrome used to be the system's
 * own — a `UINavigationBar` and a `UITabBarController`, both in Liquid Glass — and the
 * cost of that was two apps: an iOS one wearing translucent material, SF Symbols and
 * the system face, and an Android one wearing none of it. A design language stated in
 * `theme/tokens.ts` cannot reach a bar the platform paints.
 *
 * So the bars are plain views on the app's own `background`, carrying Feather icons and
 * Inter like everything else. They are opaque and sit **in flow**, which is the other
 * half of the trade: nothing scrolls under them, so no screen has to reason about
 * content insets, and `Screen` can pay its own padding on both platforms identically.
 *
 * **No rule under it.** The bar is the same plane as the page, so a hairline would be
 * drawing a seam through one surface — the content below it is already separated by the
 * cards it is made of. The tab bar keeps its own, because there a real edge is being
 * stated: the page ends and chrome begins.
 *
 * The bar pays the status-bar inset itself — no screen below it may pay it a second
 * time.
 */
function Bar({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          minHeight: CONTROL_HEIGHT.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.sm,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.sm,
        }}
      >
        {children}
      </View>
    </View>
  );
}

/**
 * The bar above every tab screen: the account mark on the left, recording something on
 * the right. Both are fixed rather than scrolling away with the page — the primary
 * action of a finance app should never be a scroll position — and stating them here is
 * what let the tab bar drop to the three destinations that are actually read every day.
 *
 * It is deliberately not a title bar. The tab bar already says which screen this is, so
 * a heading here would spend the one row a phone has on a word nobody needs.
 */
export function AppBar({ actions }: { actions?: React.ReactNode }) {
  return (
    <Bar>
      <AccountMenuButton />
      <View style={{ flex: 1 }} />
      {actions}
    </Bar>
  );
}

/**
 * The bar on a pushed screen: a chevron and the screen's name, left-aligned like every
 * other title in this app.
 *
 * **The chevron carries no label, and the title is not centred.** Both are iOS
 * conventions Android has never had, so honouring either would put the two platforms
 * back out of step. The label was worth naming while the system drew it — it read
 * `(tabs)` otherwise — but every screen this heads is reachable from exactly one place,
 * so the chevron on its own is already unambiguous.
 */
export function PushedHeader({ title }: { title: string }) {
  const t = useTranslate();
  const colors = useColors();
  const router = useRouter();

  return (
    <Bar>
      <IconButton
        label={t("common.back")}
        onPress={() => router.back()}
        style={{ marginLeft: -SPACING.sm }}
      >
        <Feather name="chevron-left" size={24} color={colors.foreground} />
      </IconButton>
      <Text variant="cardTitle" numberOfLines={1} style={{ flex: 1 }}>
        {title}
      </Text>
    </Bar>
  );
}
