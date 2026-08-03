import {
  type BudgetFiltersState,
  type BudgetProgressRow,
  type BudgetRow,
  currentMonth,
  EMPTY_BUDGET_FILTERS,
  isBudgetFiltered,
  shiftMonth,
} from "@budget-manager/client";
import {
  useBudgetMonthQuery,
  useBudgetsQuery,
  usePagedFilters,
  usePreferredCurrency,
} from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { useState } from "react";
import { View } from "react-native";

import { ListError, ListLoading } from "@/components/list-state";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { MonthStepper } from "@/components/ui/month-stepper";
import { Pagination } from "@/components/ui/pagination";
import { Fading, PageHeader, Screen } from "@/components/ui/screen";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetDetailSheet } from "@/modules/budget/components/budget-detail-sheet";
import { BudgetFilters } from "@/modules/budget/components/budget-list/budget-filters";
import { BudgetRows } from "@/modules/budget/components/budget-list/budget-rows";
import { BudgetMonthCard } from "@/modules/budget/components/budget-month-card";
import { CreateBudgetSheet } from "@/modules/budget/components/create-budget-sheet";
import { SPACING } from "@/theme/tokens";

export function ListBudgetsScreen() {
  const { t, formatMonthString } = useI18n();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<BudgetRow | null>(null);
  const [month, setMonth] = useState(currentMonth());
  const [currencyCode, setCurrencyCode] = useState<string | null>(null);
  const preferredCurrency: string = usePreferredCurrency();

  const { filters, page, setFilters, setPage } =
    usePagedFilters<BudgetFiltersState>(EMPTY_BUDGET_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useBudgetsQuery(filters, page);
  const monthQuery = useBudgetMonthQuery(month);

  const monthLabel = formatMonthString(month, "monthYear");
  const isFiltered = isBudgetFiltered(filters);

  const progress: BudgetProgressRow[] = monthQuery.data?.rows ?? [];
  const totals = monthQuery.data?.totals ?? [];

  // One currency in view at a time, exactly as on the dashboard: the stored
  // preference is only a default, so it falls back to the first currency the month
  // actually has budgets in.
  const activeTotals =
    totals.find((entry) => entry.currencyCode === currencyCode) ??
    totals.find((entry) => entry.currencyCode === preferredCurrency) ??
    totals[0];
  const activeCurrency = activeTotals?.currencyCode ?? preferredCurrency;

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <PageHeader title={t("budget.title")}>
        {/* Both controls sit above everything they scope. */}
        <View style={{ gap: SPACING.sm }}>
          {totals.length > 1 && (
            <Select
              label={t("common.currency")}
              items={totals.map((entry) => ({
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
            previousLabel={t("budget.month.previous")}
            nextLabel={t("budget.month.next")}
          />
          <Button label={t("budget.create.trigger")} onPress={() => setCreating(true)} />
        </View>
      </PageHeader>

      {/* The month card answers "is there money left"; the list below is what set
          those limits. */}
      <Fading isFetching={monthQuery.isFetching}>
        {monthQuery.isPending ? (
          <Skeleton height={220} />
        ) : (
          <BudgetMonthCard
            budgets={progress.filter((row) => row.currencyCode === activeCurrency)}
            totals={activeTotals ?? null}
            currencyCode={activeCurrency}
            monthLabel={monthLabel}
          />
        )}
      </Fading>

      <BudgetFilters filters={filters} onFiltersChange={setFilters} />

      {isPending ? (
        <ListLoading label={t("budget.loading")} />
      ) : isError ? (
        <ListError
          title={t("budget.loadFailed")}
          error={error}
          onRetry={() => void refetch()}
          isRetrying={isRefetching}
        />
      ) : data.rows.length === 0 ? (
        <Empty
          title={isFiltered ? t("budget.emptyFiltered.title") : t("budget.empty.title")}
          description={
            isFiltered
              ? t("budget.emptyFiltered.description")
              : t("budget.empty.description")
          }
        />
      ) : (
        <>
          <BudgetRows budgets={data.rows} onSelect={setSelected} />
          <Pagination
            page={page}
            total={data.total}
            onPageChange={setPage}
            isFetching={isFetching}
            resource="budgets"
          />

          {selected && (
            <BudgetDetailSheet
              key={selected.id}
              budget={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </>
      )}

      <CreateBudgetSheet month={month} open={creating} onOpenChange={setCreating} />
    </Screen>
  );
}
