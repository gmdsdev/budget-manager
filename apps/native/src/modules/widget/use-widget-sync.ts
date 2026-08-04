import type { CurrencySummary } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { useEffect } from "react";

import { setWidgetSnapshot } from "./bridge";
import {
  WIDGET_APP_GROUP,
  WIDGET_SNAPSHOT_KEY,
  buildWidgetSnapshot,
} from "./snapshot";

/**
 * Publishes the dashboard's own figures to the home-screen widget.
 *
 * It hangs off the dashboard screen rather than the tab layout on purpose. The
 * payload is the heaviest query in the app, and the dashboard is the tab the app
 * opens on, so syncing from here costs **no extra request** — React Query is
 * already holding exactly the data the widget wants. Mounting a second
 * `useDashboardQuery(currentMonth())` higher up would have fetched it again for
 * anyone who opened the app straight onto another tab.
 *
 * `enabled` is what keeps the widget honest about *which* month it is reporting:
 * the screen lets the reader step back through history, and a widget quoting March
 * on a home screen in August is worse than one that has not moved. So a snapshot is
 * only ever written while the month in view is the current one — stepping away
 * leaves the last good one in place rather than overwriting it.
 *
 * A failed write is swallowed. The widget is a convenience on a surface the reader
 * is not currently looking at; a toast about it over the dashboard would be noise
 * about a screen that is working fine.
 */
export function useWidgetSync({
  summaries,
  preferredCurrency,
  monthLabel,
  enabled,
}: {
  summaries: readonly CurrencySummary[] | undefined;
  preferredCurrency: string;
  monthLabel: string;
  enabled: boolean;
}) {
  const { t, formatDate } = useI18n();

  useEffect(() => {
    if (!enabled || !summaries || summaries.length === 0) {
      return;
    }

    const snapshot = buildWidgetSnapshot({
      summaries,
      preferredCurrency,
      monthLabel,
      updatedAtLabel: t("widget.updated", {
        time: formatDate(new Date(), "dayTime"),
      }),
      labels: {
        balance: t("dashboard.stat.inWallets"),
        income: t("dashboard.stat.income"),
        expense: t("dashboard.stat.expenses"),
        net: t("dashboard.stat.net"),
      },
    });

    void setWidgetSnapshot(
      WIDGET_APP_GROUP,
      WIDGET_SNAPSHOT_KEY,
      JSON.stringify(snapshot),
    ).catch(() => undefined);
  }, [enabled, summaries, preferredCurrency, monthLabel, t, formatDate]);
}
