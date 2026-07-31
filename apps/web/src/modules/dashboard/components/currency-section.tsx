import type { Translate } from "@budget-manager/i18n";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { CurrencySummary } from "../types";
import { CardUtilisationCard } from "./card-utilisation-card";
import { CashFlowChart } from "./cash-flow-chart";
import { NetSparkline } from "./net-sparkline";
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
  const hasPending = summary.projectedBalanceCents !== summary.balanceCents;
  const hasCards = summary.cardCount > 0;
  const hasWallets = summary.wallets.length > 0;

  return (
    <section
      className="space-y-4"
      aria-label={t("dashboard.section.label", {
        currency: summary.currencyCode,
      })}
    >
      <div className="flex flex-row flex-wrap items-baseline gap-x-2 gap-y-1">
        <h2 className="font-heading text-sm font-bold tracking-wide uppercase">
          {summary.currencyCode}
        </h2>
        <p className="text-xs text-muted-foreground">
          {accountsLine(t, summary)} · {monthLabel}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          lead
          label={t("dashboard.stat.inWallets")}
          amountCents={summary.balanceCents}
          currencyCode={summary.currencyCode}
          hint={
            hasPending
              ? t("dashboard.stat.inWallets.projected", {
                  amount: formatMinorUnits(
                    summary.projectedBalanceCents,
                    summary.currencyCode,
                  ),
                })
              : t("dashboard.stat.inWallets.settled")
          }
        />
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
        >
          <NetSparkline
            trend={summary.trend}
            label={t("dashboard.stat.net.sparkline", {
              currency: summary.currencyCode,
              months: summary.trend.length,
            })}
          />
        </StatTile>
      </div>

      {hasCards && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatTile
            label={t("dashboard.stat.onCards")}
            amountCents={summary.cardOutstandingCents}
            currencyCode={summary.currencyCode}
            hint={t("dashboard.stat.onCards.hint")}
          />
          <StatTile
            label={t("dashboard.stat.creditAvailable")}
            amountCents={summary.cardAvailableCents}
            currencyCode={summary.currencyCode}
            hint={t("dashboard.stat.creditAvailable.hint")}
          />
          <StatTile
            label={t("dashboard.stat.netPosition")}
            amountCents={summary.netWorthCents}
            currencyCode={summary.currencyCode}
            hint={t("dashboard.stat.netPosition.hint")}
          />
        </div>
      )}

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
