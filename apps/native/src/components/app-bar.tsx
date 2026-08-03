import { useTranslate } from "@budget-manager/i18n/react";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AccountAvatar } from "@/components/account-avatar";
import { AccountMenuSheet } from "@/components/account-menu-sheet";
import { authClient } from "@/lib/auth-client";
import { CreateTransactionMenu } from "@/modules/transaction/components/create-transaction-menu";
import { useColors } from "@/theme/theme-provider";
import { RADIUS, SPACING } from "@/theme/tokens";

/**
 * The bar above every tab screen: the account mark on the left, and recording
 * something on the right. Both are fixed rather than scrolling away with the page —
 * the primary action of a finance app should never be a scroll position — and stating
 * them here is what let the tab bar drop to the three destinations that are actually
 * read every day.
 *
 * It is deliberately not a title bar. The tab bar already says which screen this is,
 * so a heading here would spend the one row a phone has on a word nobody needs.
 */
export function AppBar() {
  const t = useTranslate();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = authClient.useSession();

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: SPACING.md,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.sm,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.menu")}
          accessibilityState={{ expanded: menuOpen }}
          onPress={() => setMenuOpen(true)}
          hitSlop={8}
          style={({ pressed }) => ({
            borderRadius: RADIUS.full,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <AccountAvatar name={session?.user.name ?? ""} />
        </Pressable>

        <CreateTransactionMenu />
      </View>

      <AccountMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
