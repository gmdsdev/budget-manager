import { type CurrencySummary } from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";
import { View } from "react-native";

import { BalanceHero } from "@/modules/dashboard/components/balance-hero";
import { CashFlowChart } from "@/modules/dashboard/components/cash-flow-chart";
import { MonthSummary } from "@/modules/dashboard/components/month-summary";
import { SpendingBreakdown } from "@/modules/dashboard/components/spending-breakdown";
import { SPACING } from "@/theme/tokens";

function accountsLine(
  t: ReturnType<typeof useTranslate>,
  summary: CurrencySummary,
) {
  const wallets =
    summary.walletCount === 1
      ? t("dashboard.accounts.oneWallet")
      : t("dashboard.accounts.wallets", { count: summary.walletCount });

  if (summary.cardCount === 0) {
    return wallets;
  }

  const cards =
    summary.cardCount === 1
      ? t("dashboard.accounts.oneCard")
      : t("dashboard.accounts.cards", { count: summary.cardCount });

  return `${wallets} · ${cards}`;
}

/**
 * **A phone dashboard answers four questions and stops.** How much have I got, what
 * did this month do, what needs paying, and where did it go — in that order, because
 * that is the order they are asked in, and because the two that can be *acted* on come
 * before the two that can only be read.
 *
 * Four sections were cut rather than made smaller, and each for the same reason: it
 * was a *second* place to read something the phone already has a first place for.
 *
 * - The **budget widget** duplicated the Budgets tab, one tap away in the bar below.
 * - **Wallet balances** and **card utilisation** were a meter per account — the detail
 *   behind a figure the hero already states, and both live on their own screens.
 * - The three **stat tiles** became `MonthSummary`: three numbers do not need three
 *   full-width cards.
 *
 * What is left is roughly a screen and a half instead of eight, and every figure on it
 * is one the reader came for.
 */
export function CurrencySection({
  summary,
  monthLabel,
  children,
}: {
  summary: CurrencySummary;
  monthLabel: string;
  /**
   * The statements and awaiting-payment lists. They sit above the analysis rather
   * than under it — a bill you have not paid outranks a chart of ones you have — but
   * the screen owns them, because they come from the payload's top level and are
   * filtered to this currency there.
   */
  children?: React.ReactNode;
}) {
  const t = useTranslate();
  const hasCards = summary.cardCount > 0;

  return (
    <View
      accessibilityLabel={t("dashboard.section.label", {
        currency: summary.currencyCode,
      })}
      style={{ gap: SPACING.md }}
    >
      <BalanceHero
        label={t("dashboard.stat.inWallets")}
        amountCents={summary.balanceCents}
        projectedAmountCents={summary.projectedBalanceCents}
        currencyCode={summary.currencyCode}
        // The currency the figures are in is not decoration: nothing here is ever
        // summed across currencies, so the card has to say which one it is reporting.
        // Whether the balance is settled or still projecting is the card's own job now.
        context={`${summary.currencyCode} · ${accountsLine(t, summary)} · ${monthLabel}`}
        // Two splits, not three. Three wrapped 2+1 on a phone and the third was
        // `Credit available`, which is a reading of the two beside it and lives on
        // the cards screen — where a limit is something you can act on.
        splits={
          hasCards
            ? [
                {
                  key: "netPosition",
                  label: t("dashboard.stat.netPosition"),
                  amountCents: summary.netWorthCents,
                },
                {
                  key: "onCards",
                  label: t("dashboard.stat.onCards"),
                  amountCents: summary.cardOutstandingCents,
                },
              ]
            : undefined
        }
      />

      <MonthSummary
        monthLabel={monthLabel}
        currencyCode={summary.currencyCode}
        incomeCents={summary.incomeCents}
        expenseCents={summary.expenseCents}
        netCents={summary.netCents}
      />

      {children}

      <SpendingBreakdown
        categories={summary.topCategories}
        currencyCode={summary.currencyCode}
        monthLabel={monthLabel}
        expenseCents={summary.expenseCents}
      />

      <CashFlowChart trend={summary.trend} currencyCode={summary.currencyCode} />
    </View>
  );
}
