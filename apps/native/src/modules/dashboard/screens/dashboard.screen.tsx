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
import { Fading, Screen } from "@/components/ui/screen";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencySection } from "@/modules/dashboard/components/currency-section";
import { PendingList } from "@/modules/dashboard/components/pending-list";
import { StatementsDueList } from "@/modules/dashboard/components/statements-due-list";
import { useWidgetSync } from "@/modules/widget/use-widget-sync";
import { SPACING } from "@/theme/tokens";

/** Wide enough for a currency code and its chevron, so the chip never reflows. */
const CURRENCY_CHIP_WIDTH = 96;

/**
 * The dashboard reads top-down: the balance, the month, what needs paying, then the
 * analysis. Both controls sit above everything they scope, and a refetch holds the
 * previous render at reduced opacity instead of flashing skeletons, so changing month
 * never jumps the screen.
 *
 * It carries **no page title.** The tab bar already says which screen this is and the
 * hero states `currency · accounts · month`, so a 32px "Dashboard" spent the top of a
 * phone repeating two things the reader can already see.
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

  // The home-screen widget reads these same figures, so it can never disagree with
  // the screen behind it — but only while the month in view is the current one.
  useWidgetSync({
    summaries: data?.currencies,
    preferredCurrency,
    monthLabel,
    enabled: isCurrentMonth,
  });

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      {/* One row: both controls scope the same screen, so they read as one bar of
          scope rather than as two decisions stacked on top of each other. The
          currency is sized to its code and the stepper takes **all** the rest, which
          is what lands its two arrows on the row's own edges — the justified look,
          and the only version of it where the next arrow cannot be pushed past the
          screen. Leaving the stepper to size itself did exactly that. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.sm,
          paddingTop: SPACING.md,
        }}
      >
        {/* A single-currency account has nothing to pick, so the select only
            appears once there is a second one. */}
        {currencies.length > 1 && activeCurrency && (
          <Select
            label={t("common.currency")}
            size="sm"
            items={currencies.map((entry) => ({
              label: entry.currencyCode,
              value: entry.currencyCode,
            }))}
            value={activeCurrency}
            onValueChange={setCurrencyCode}
            style={{ width: CURRENCY_CHIP_WIDTH }}
          />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <MonthStepper
            label={monthLabel}
            onPrevious={() => setMonth(shiftMonth(month, -1))}
            onNext={() => setMonth(shiftMonth(month, 1))}
            previousLabel={t("dashboard.previousMonth")}
            nextLabel={t("dashboard.nextMonth")}
            nextDisabled={isCurrentMonth}
          />
        </View>
      </View>

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
          {summary && (
            <CurrencySection summary={summary} monthLabel={monthLabel}>
              <StatementsDueList
                statements={data.statements.filter(
                  (bill) => bill.currencyCode === activeCurrency,
                )}
                today={data.today}
                onOpenCards={() => router.push("/credit-card")}
              />
              <PendingList
                items={data.pending.filter(
                  (item) => item.walletCurrencyCode === activeCurrency,
                )}
                today={data.today}
                onOpenTransactions={() => router.push("/transaction")}
              />
            </CurrencySection>
          )}
        </Fading>
      )}
    </Screen>
  );
}
