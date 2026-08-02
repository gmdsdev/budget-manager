import { currentMonth, shiftMonth } from "@budget-manager/client";
import { useDashboardQuery, usePreferredCurrency } from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { ListError } from "@/components/list-state";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { MonthStepper } from "@/components/ui/month-stepper";
import { Fading, PageHeader, Screen } from "@/components/ui/screen";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencySection } from "@/modules/dashboard/components/currency-section";
import { PendingList } from "@/modules/dashboard/components/pending-list";
import { StatementsDueList } from "@/modules/dashboard/components/statements-due-list";
import { SPACING } from "@/theme/tokens";

/**
 * The dashboard reads top-down: figures, then charts, then the lists that need acting
 * on. Both controls sit above everything they scope, and a refetch holds the previous
 * render at reduced opacity instead of flashing skeletons, so changing month never
 * jumps the screen.
 */
export function DashboardScreen() {
  const { t, formatMonthString } = useI18n();
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth());
  const [currencyCode, setCurrencyCode] = useState<string | null>(null);
  const preferredCurrency: string = usePreferredCurrency();

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useDashboardQuery(month);

  const monthLabel = formatMonthString(month, "monthYear");
  const isCurrentMonth = month === currentMonth();

  // One currency is in view at a time, and it is the whole screen's scope: the
  // account's default is only a preference, so a currency that stops existing (or a
  // first load that has none yet) falls back to the first one the API returned.
  const currencies = data?.currencies ?? [];
  const summary =
    currencies.find((entry) => entry.currencyCode === currencyCode) ??
    currencies.find((entry) => entry.currencyCode === preferredCurrency) ??
    currencies[0];
  const activeCurrency = summary?.currencyCode;

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <PageHeader title={t("dashboard.title")}>
        <View style={{ gap: SPACING.sm }}>
          {/* A single-currency account has nothing to pick, so the select only
              appears once there is a second one. */}
          {currencies.length > 1 && activeCurrency && (
            <Select
              label={t("common.currency")}
              items={currencies.map((entry) => ({
                label: entry.currencyCode,
                value: entry.currencyCode,
              }))}
              value={activeCurrency}
              onValueChange={setCurrencyCode}
            />
          )}
          <MonthStepper
            label={monthLabel}
            onPrevious={() => setMonth(shiftMonth(month, -1))}
            onNext={() => setMonth(shiftMonth(month, 1))}
            previousLabel={t("dashboard.previousMonth")}
            nextLabel={t("dashboard.nextMonth")}
            nextDisabled={isCurrentMonth}
          />
        </View>
      </PageHeader>

      {isPending ? (
        <View style={{ gap: SPACING.md }}>
          <Skeleton height={96} />
          <Skeleton height={96} />
          <Skeleton height={220} />
        </View>
      ) : isError ? (
        <ListError
          title={t("dashboard.loadFailed")}
          error={error}
          onRetry={() => void refetch()}
          isRetrying={isRefetching}
        />
      ) : data.currencies.length === 0 ? (
        <Empty
          title={t("dashboard.empty.title")}
          description={t("dashboard.empty.description")}
          action={
            <Button
              label={t("dashboard.empty.action")}
              onPress={() => router.push("/wallet")}
            />
          }
        />
      ) : (
        <Fading isFetching={isFetching}>
          <View style={{ gap: SPACING.lg }}>
            {summary && (
              <CurrencySection
                summary={summary}
                monthLabel={monthLabel}
                onOpenBudgets={() => router.push("/budget")}
              />
            )}

            <StatementsDueList
              statements={data.statements.filter(
                (bill) => bill.currencyCode === activeCurrency,
              )}
              today={data.today}
              onOpenTransactions={() => router.push("/transaction")}
            />
            <PendingList
              items={data.pending.filter(
                (item) => item.walletCurrencyCode === activeCurrency,
              )}
              today={data.today}
              onOpenTransactions={() => router.push("/transaction")}
            />
          </View>
        </Fading>
      )}
    </Screen>
  );
}
