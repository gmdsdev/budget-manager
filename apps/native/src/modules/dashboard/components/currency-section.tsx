import { type CurrencySummary } from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import {
  BudgetProgressCard,
} from "@/modules/dashboard/components/budget-progress-card";
import {
  CardUtilisationCard,
} from "@/modules/dashboard/components/card-utilisation-card";
import { CashFlowChart } from "@/modules/dashboard/components/cash-flow-chart";
import { NetSparkline } from "@/modules/dashboard/components/net-sparkline";
import { SpendingBreakdown } from "@/modules/dashboard/components/spending-breakdown";
import { StatTile } from "@/modules/dashboard/components/stat-tile";
import {
  WalletBalancesCard,
} from "@/modules/dashboard/components/wallet-balances-card";
import { useColors } from "@/theme/theme-provider";
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

export function CurrencySection({
  summary,
  monthLabel,
  onOpenBudgets,
}: {
  summary: CurrencySummary;
  monthLabel: string;
  onOpenBudgets: () => void;
}) {
  const t = useTranslate();
  const colors = useColors();
  const hasPending = summary.projectedBalanceCents !== summary.balanceCents;
  const hasCards = summary.cardCount > 0;

  return (
    <View
      accessibilityLabel={t("dashboard.section.label", {
        currency: summary.currencyCode,
      })}
      style={{ gap: SPACING.md }}
    >
      <View style={{ gap: 2 }}>
        <Text variant="h2">{summary.currencyCode}</Text>
        <Text variant="tiny" tone="muted">
          {`${accountsLine(t, summary)} · ${monthLabel}`}
        </Text>
      </View>

      <View style={{ gap: SPACING.md }}>
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
          swatch={colors.chartIncome}
          amountCents={summary.incomeCents}
          currencyCode={summary.currencyCode}
          hint={t("dashboard.stat.income.hint", { month: monthLabel })}
        />
        <StatTile
          label={t("dashboard.stat.expenses")}
          swatch={colors.chartExpense}
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
      </View>

      {hasCards && (
        <View style={{ gap: SPACING.md }}>
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
            // Without this figure the dashboard reads as though money owed on cards
            // does not exist.
            label={t("dashboard.stat.netPosition")}
            amountCents={summary.netWorthCents}
            currencyCode={summary.currencyCode}
            hint={t("dashboard.stat.netPosition.hint")}
          />
        </View>
      )}

      <CashFlowChart trend={summary.trend} currencyCode={summary.currencyCode} />

      <SpendingBreakdown
        categories={summary.topCategories}
        currencyCode={summary.currencyCode}
        monthLabel={monthLabel}
        expenseCents={summary.expenseCents}
      />

      {summary.budgets.length > 0 && (
        <BudgetProgressCard
          budgets={summary.budgets}
          totals={summary.budgetTotals}
          currencyCode={summary.currencyCode}
          monthLabel={monthLabel}
          onOpenBudgets={onOpenBudgets}
        />
      )}

      {summary.wallets.length > 0 && (
        <WalletBalancesCard
          wallets={summary.wallets}
          currencyCode={summary.currencyCode}
        />
      )}

      {hasCards && (
        <CardUtilisationCard
          cards={summary.cards}
          currencyCode={summary.currencyCode}
        />
      )}
    </View>
  );
}
