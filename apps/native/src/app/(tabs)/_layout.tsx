import { useTranslate } from "@budget-manager/i18n/react";
import { NativeTabs } from "expo-router/unstable-native-tabs";

import { useTheme } from "@/theme/theme-provider";

/**
 * **Three tabs, not five.** Dashboard, Transactions and Budgets are what the app is
 * actually opened for; wallets, cards, categories and settings are things you visit to
 * set something up, so they live behind the account mark in `AppBar`. The bar this
 * replaced spent one of five slots on a **More** tab — a destination whose only
 * content was a list of other destinations — and the remaining four were narrow enough
 * that the labels were the only way to tell them apart.
 *
 * **`NativeTabs`, not `Tabs`.** This is a real `UITabBarController` through
 * `react-native-screens`, which is the only way to get the system's own bar — Liquid
 * Glass, the scroll-edge treatment and `minimizeBehavior` are drawn by iOS, and a bar
 * that React Native paints itself can never have them however closely it is styled.
 *
 * The trade is deliberate: the bar reads as **iOS rather than as Neptune**. It takes
 * SF Symbols instead of the app's Feather set and the system font instead of Inter,
 * and no `backgroundColor` or `labelStyle` — either would replace the material with a
 * flat fill and undo the point of using it. Everything above the bar is still the
 * app's own design language.
 *
 * Two things are named explicitly, and neither touches the material:
 *
 * - The **tone** of the glass. This app's mode is its own rather than the system's,
 *   and `Appearance.setColorScheme` does not reach either bar, so leaving the effect
 *   to `systemDefault` puts light glass under a dark app on a phone in light mode.
 * - The **tint**, so the selected tab is the brand's green rather than iOS blue. It
 *   reads `link`, not `primary`: bright green is the brand *surface*, and on the light
 *   material it would be about as legible as it is on white. `link` is the green that
 *   is already defined as ink in both modes — forest in light, bright in dark.
 */
export default function TabsLayout() {
  const t = useTranslate();
  const { mode, colors } = useTheme();

  return (
    // `automatic` lets iOS shrink the bar out of the way on a long scroll, which is
    // its own reason to be native: the ledger gets the height back.
    <NativeTabs
      minimizeBehavior="automatic"
      tintColor={colors.link}
      blurEffect={
        mode === "dark" ? "systemChromeMaterialDark" : "systemChromeMaterialLight"
      }
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="square.grid.2x2" />
        <NativeTabs.Trigger.Label>{t("nav.dashboard")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="transaction">
        <NativeTabs.Trigger.Icon sf="list.bullet" />
        <NativeTabs.Trigger.Label>
          {t("nav.transactions")}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="budget">
        <NativeTabs.Trigger.Icon sf="chart.pie" />
        <NativeTabs.Trigger.Label>{t("nav.budgets")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
