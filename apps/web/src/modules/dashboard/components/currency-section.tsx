import type { Translate } from "@budget-manager/i18n";
import { useTranslate } from "@budget-manager/i18n/react";
import type { CurrencySummary } from "@budget-manager/client";
import { CreateTransactionMenu } from "@/modules/transaction/components/create-transaction-menu";
import { BalanceHero } from "./balance-hero";
import { BudgetProgressCard } from "./budget-progress-card";
import { CardUtilisationCard } from "./card-utilisation-card";
import { CashFlowChart } from "./cash-flow-chart";
import { SpendingBreakdown } from "./spending-breakdown";
import { StatTile } from "./stat-tile";
import { WalletBalancesCard } from "./wallet-balances-card";

function accountsLine(t: Translate, summary: CurrencySummary) {
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

export function CurrencySection({
  summary,
  monthLabel,
}: {
  summary: CurrencySummary;
  monthLabel: string;
}) {
  const t = useTranslate();
  const hasCards = summary.cardCount > 0;
  const hasWallets = summary.wallets.length > 0;
  const hasBudgets = summary.budgets.length > 0;

  return (
    <section
      className="space-y-4"
      aria-label={t("dashboard.section.label", {
        currency: summary.currencyCode,
      })}
    >
      {/* The lead figure opens the page as a card, in the same grammar as the
          transaction totals; the month's three movement figures follow as
          tiles. Card debt rides in the hero's split row — without it the
          balance reads as though money owed does not exist. The currency in
          the context line is not decoration: nothing on this page is ever
          summed across currencies, so the card has to say which one it is
          reporting. */}
      <BalanceHero
        label={t("dashboard.stat.inWallets")}
        amountCents={summary.balanceCents}
        projectedAmountCents={summary.projectedBalanceCents}
        currencyCode={summary.currencyCode}
        context={`${summary.currencyCode} · ${accountsLine(t, summary)} · ${monthLabel}`}
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
                {
                  key: "creditAvailable",
                  label: t("dashboard.stat.creditAvailable"),
                  amountCents: summary.cardAvailableCents,
                },
              ]
            : undefined
        }
        action={<CreateTransactionMenu layout="stacked" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label={t("dashboard.stat.income")}
          swatch="var(--chart-income)"
          amountCents={summary.incomeCents}
          currencyCode={summary.currencyCode}
          hint={t("dashboard.stat.income.hint", { month: monthLabel })}
        />
        <StatTile
          label={t("dashboard.stat.expenses")}
          swatch="var(--chart-expense)"
          amountCents={summary.expenseCents}
          currencyCode={summary.currencyCode}
          hint={t("dashboard.stat.expenses.hint", { month: monthLabel })}
        />
        <StatTile
          label={t("dashboard.stat.net")}
          amountCents={summary.netCents}
          currencyCode={summary.currencyCode}
          hint={t("dashboard.stat.net.hint")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <CashFlowChart
            trend={summary.trend}
            currencyCode={summary.currencyCode}
          />
        </div>
        <div className="min-w-0 lg:col-span-5">
          <SpendingBreakdown
            categories={summary.topCategories}
            currencyCode={summary.currencyCode}
            monthLabel={monthLabel}
            expenseCents={summary.expenseCents}
          />
        </div>
      </div>

      {hasBudgets && (
        <BudgetProgressCard
          budgets={summary.budgets}
          totals={summary.budgetTotals}
          currencyCode={summary.currencyCode}
          monthLabel={monthLabel}
        />
      )}

      {(hasWallets || hasCards) && (
        <div className="grid gap-4 lg:grid-cols-12">
          {hasWallets && (
            <div
              className={`min-w-0 ${hasCards ? "lg:col-span-5" : "lg:col-span-12"}`}
            >
              <WalletBalancesCard
                wallets={summary.wallets}
                currencyCode={summary.currencyCode}
              />
            </div>
          )}
          {hasCards && (
            <div
              className={`min-w-0 ${hasWallets ? "lg:col-span-7" : "lg:col-span-12"}`}
            >
              <CardUtilisationCard
                cards={summary.cards}
                currencyCode={summary.currencyCode}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
