import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router/js-tabs";

import { AppTabBar } from "@/components/tab-bar";
import { useColors } from "@/theme/theme-provider";

/**
 * **Three tabs, not five.** Dashboard, Transactions and Budgets are what the app is
 * actually opened for; wallets, cards, categories and settings are things you visit to
 * set something up, so they live behind the account mark in `AppBar`. The bar this
 * replaced spent one of five slots on a **More** tab — a destination whose only
 * content was a list of other destinations — and the remaining four were narrow enough
 * that the labels were the only way to tell them apart.
 *
 * **A JS navigator with a tab bar of our own**, not `NativeTabs`. A real
 * `UITabBarController` is the only way to get Liquid Glass — and the only way to get it
 * is to accept that it exists on one platform, takes SF Symbols instead of Feather, the
 * system face instead of Inter, and refuses a `backgroundColor` or a `labelStyle`
 * because either would replace the material with a flat fill. That is one app on iOS
 * and a different one on Android. `AppTabBar` is the same bar on both.
 *
 * The header comes from the stack above this one, so the account mark and the create
 * action are declared once for all three tabs rather than per screen.
 */
export default function TabsLayout() {
  const t = useTranslate();
  const colors = useColors();

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
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
    </Tabs>
  );
}
