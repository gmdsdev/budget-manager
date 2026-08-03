import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { AppBar } from "@/components/app-bar";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, FONTS } from "@/theme/tokens";

/**
 * **Three tabs, not five.** Dashboard, Transactions and Budgets are what the app is
 * actually opened for; wallets, cards, categories and settings are things you visit to
 * set something up, so they live behind the account mark in `AppBar`. The bar this
 * replaced spent one of five slots on a **More** tab — a destination whose only
 * content was a list of other destinations — and the remaining four were narrow enough
 * that the labels were the only way to tell them apart.
 *
 * `AppBar` is the header rather than something each screen renders, so the account
 * mark and the create action are fixed on every tab instead of scrolling away, and it
 * is what pays the status-bar inset — `sceneStyle` must not pay it a second time.
 */
export default function TabsLayout() {
  const t = useTranslate();
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        header: () => <AppBar />,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: BORDER_WIDTH,
          borderTopColor: colors.border,
        },
        // Sentence case, like everything else: the uppercase treatment survives
        // only on the eyebrow over a figure.
        tabBarLabelStyle: {
          fontFamily: FONTS.medium,
          fontSize: 11,
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
    </Tabs>
  );
}
