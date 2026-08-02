import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/theme/theme-provider";
import { FONTS, PLATE_BORDER_WIDTH } from "@/theme/tokens";

/**
 * The web's seven destinations do not fit a phone's tab bar, so the four the app
 * is used from every day get one each and the account-shaped ones (cards,
 * categories, settings) sit behind **More** — reachable in one extra tap rather
 * than crammed into a bar nobody can hit.
 */
export default function TabsLayout() {
  const t = useTranslate();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // A tab screen draws its own title, so nothing is consuming the status bar
        // and it read straight through the clock. The inset is applied here rather
        // than in `Screen`, beside the `headerShown` that creates the need for it:
        // the three screens pushed from More keep a native header, which already
        // clears the status bar, and paying it twice leaves them a hole under it.
        sceneStyle: {
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: PLATE_BORDER_WIDTH,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.semibold,
          fontSize: 10,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.dashboard"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transaction"
        options={{
          title: t("nav.transactions"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: t("nav.budgets"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="target" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t("nav.wallets"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="credit-card" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t("common.menu"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="more-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
