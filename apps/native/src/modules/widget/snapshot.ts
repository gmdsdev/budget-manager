import type { CurrencySummary } from "@budget-manager/client";
import { formatMinorUnits } from "@budget-manager/money";

/**
 * The one payload the home-screen widget reads, and the only contract between
 * TypeScript and the Swift in `targets/widget/`.
 *
 * **Every string in it is already translated and already formatted.** The widget
 * is a WidgetKit extension: it cannot import `@budget-manager/i18n`, and a Swift
 * `NumberFormatter` beside `formatMinorUnits` is exactly the second implementation
 * the money package exists to prevent — BRL reads `R$ 1.234,56` for every reader,
 * which only the shared formatter knows. So the app hands the widget words and
 * figures it has already resolved, and the widget lays them out. That also means a
 * reworded message or a new locale reaches the widget with no Swift change at all.
 *
 * `cents` rides alongside each formatted figure because sign is a *layout* decision
 * the widget has to make (a negative net is inked red), and parsing it back out of
 * a localized string would be its own bug.
 */
export const WIDGET_SNAPSHOT_VERSION = 1;

/** Where the app and the widget meet. Mirrored in `targets/widget/expo-target.config.js`. */
export const WIDGET_APP_GROUP = "group.dev.gmds.kivo";

/** The key the snapshot is stored under inside that group's `UserDefaults`. */
export const WIDGET_SNAPSHOT_KEY = "dashboardSnapshot";

export type WidgetFigure = {
  cents: number;
  text: string;
};

export type WidgetCurrency = {
  code: string;
  /** `August 2026` — the month the income and expense figures cover. */
  monthLabel: string;
  /** Wallet money only, settled. The headline. */
  balance: WidgetFigure;
  income: WidgetFigure;
  expense: WidgetFigure;
  net: WidgetFigure;
};

export type WidgetSnapshot = {
  version: number;
  /** Already formatted in the app's locale — see the note above. */
  updatedAtLabel: string;
  /** The code the widget opens on when its own currency is no longer present. */
  preferredCurrency: string;
  labels: {
    balance: string;
    income: string;
    expense: string;
    net: string;
  };
  currencies: WidgetCurrency[];
};

type Labels = WidgetSnapshot["labels"];

function figure(cents: number, currencyCode: string): WidgetFigure {
  return { cents, text: formatMinorUnits(cents, currencyCode) };
}

/**
 * Reads the same `CurrencySummary` the dashboard draws, so the widget can never
 * report a balance the screen behind it disagrees with.
 */
export function buildWidgetSnapshot({
  summaries,
  preferredCurrency,
  monthLabel,
  updatedAtLabel,
  labels,
}: {
  summaries: readonly CurrencySummary[];
  preferredCurrency: string;
  monthLabel: string;
  updatedAtLabel: string;
  labels: Labels;
}): WidgetSnapshot {
  return {
    version: WIDGET_SNAPSHOT_VERSION,
    updatedAtLabel,
    preferredCurrency,
    labels,
    currencies: summaries.map((summary) => ({
      code: summary.currencyCode,
      monthLabel,
      balance: figure(summary.balanceCents, summary.currencyCode),
      income: figure(summary.incomeCents, summary.currencyCode),
      expense: figure(summary.expenseCents, summary.currencyCode),
      net: figure(summary.netCents, summary.currencyCode),
    })),
  };
}
