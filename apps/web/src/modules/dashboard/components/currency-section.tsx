import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { CurrencySummary } from "../types";
import { CardUtilisationCard } from "./card-utilisation-card";
import { CashFlowChart } from "./cash-flow-chart";
import { NetSparkline } from "./net-sparkline";
import { SpendingBreakdown } from "./spending-breakdown";
import { StatTile } from "./stat-tile";
import { WalletBalancesCard } from "./wallet-balances-card";

function accountsLine(summary: CurrencySummary) {
  const wallets =
    summary.walletCount === 1 ? "1 wallet" : `${summary.walletCount} wallets`;
  const cards =
    summary.cardCount === 0
      ? ""
      : ` · ${summary.cardCount === 1 ? "1 card" : `${summary.cardCount} cards`}`;

  return `${wallets}${cards}`;
}

export function CurrencySection({
  summary,
  monthLabel,
}: {
  summary: CurrencySummary;
  monthLabel: string;
}) {
  const hasPending = summary.projectedBalanceCents !== summary.balanceCents;
  const hasCards = summary.cardCount > 0;
  const hasWallets = summary.wallets.length > 0;

  return (
    <section className="space-y-4" aria-label={`${summary.currencyCode} summary`}>
      <div className="flex flex-row flex-wrap items-baseline gap-x-2 gap-y-1">
        <h2 className="font-heading text-sm font-bold tracking-wide uppercase">
          {summary.currencyCode}
        </h2>
        <p className="text-xs text-muted-foreground">
          {accountsLine(summary)} · {monthLabel}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          lead
          label="In wallets"
          amountCents={summary.balanceCents}
          currencyCode={summary.currencyCode}
          hint={
            hasPending
              ? `${formatMinorUnits(
                  summary.projectedBalanceCents,
                  summary.currencyCode,
                )} once pending rows settle`
              : "Settled rows only"
          }
        />
        <StatTile
          label="Income"
          swatch="var(--chart-income)"
          amountCents={summary.incomeCents}
          currencyCode={summary.currencyCode}
          hint={`Earned in ${monthLabel}`}
        />
        <StatTile
          label="Expenses"
          swatch="var(--chart-expense)"
          amountCents={summary.expenseCents}
          currencyCode={summary.currencyCode}
          hint={`Spent in ${monthLabel}`}
        />
        <StatTile
          label="Net"
          amountCents={summary.netCents}
          currencyCode={summary.currencyCode}
          hint="Income minus spending, pending rows included"
        >
          <NetSparkline
            trend={summary.trend}
            label={`Monthly net in ${summary.currencyCode} over the last ${summary.trend.length} months`}
          />
        </StatTile>
      </div>

      {hasCards && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatTile
            label="On cards"
            amountCents={summary.cardOutstandingCents}
            currencyCode={summary.currencyCode}
            hint="Outstanding across your cards"
          />
          <StatTile
            label="Credit available"
            amountCents={summary.cardAvailableCents}
            currencyCode={summary.currencyCode}
            hint="Limits minus what is owed"
          />
          <StatTile
            label="Net position"
            amountCents={summary.netWorthCents}
            currencyCode={summary.currencyCode}
            hint="Wallets minus what the cards owe"
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
