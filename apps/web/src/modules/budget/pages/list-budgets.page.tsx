import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/pagination";
import { usePagedFilters } from "@/hooks/use-paged-filters";
import { usePreferredCurrency } from "@/hooks/use-preferred-currency";
import { getErrorMessage } from "@/utils/error-message";
import { useI18n } from "@budget-manager/i18n/react";
import { Button } from "@budget-manager/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@budget-manager/ui/components/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@budget-manager/ui/components/select";
import { Skeleton } from "@budget-manager/ui/components/skeleton";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { BudgetFilters } from "../components/budget-list/budget-filters";
import { useBudgetColumns } from "../components/budget-list/columns";
import { BudgetMonthCard } from "../components/budget-month-card";
import { CreateBudgetDialog } from "../components/create-budget-dialog";
import { useBudgetMonthQuery } from "../queries/use-budget-month-query";
import { useBudgetsQuery } from "../queries/use-budgets-query";
import {
  EMPTY_BUDGET_FILTERS,
  isBudgetFiltered,
  type BudgetFiltersState,
  type BudgetProgressRow,
} from "../types";
import { currentMonth, shiftMonth } from "../utils/month";

export default function ListBudgetsPage() {
  const { t, formatMonthString } = useI18n();
  const columns = useBudgetColumns();
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
  // preference is only a default, so it falls back to the first currency the
  // month actually has budgets in.
  const activeTotals =
    totals.find((entry) => entry.currencyCode === currencyCode) ??
    totals.find((entry) => entry.currencyCode === preferredCurrency) ??
    totals[0];
  const activeCurrency = activeTotals?.currencyCode ?? preferredCurrency;

  return (
    <div className="pb-8">
      <header className="flex flex-col gap-3 pt-6 pb-4 sm:pt-10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <h1 className="text-xl font-bold tracking-wide uppercase sm:text-2xl">
          {t("budget.title")}
        </h1>

        {/* Both controls sit above everything they scope. */}
        <div className="flex flex-row flex-wrap items-center gap-2">
          {totals.length > 1 && (
            <Select<string>
              items={totals.map((entry) => ({
                label: entry.currencyCode,
                value: entry.currencyCode,
              }))}
              id="budget-currency"
              value={activeCurrency}
              onValueChange={setCurrencyCode}
            >
              <SelectTrigger
                aria-label={t("common.currency")}
                className="min-w-20"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {totals.map((entry) => (
                  <SelectItem
                    key={entry.currencyCode}
                    value={entry.currencyCode}
                  >
                    {entry.currencyCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex flex-1 flex-row items-center gap-1 sm:flex-none">
            <Button
              variant="outline"
              size="icon"
              aria-label={t("budget.month.previous")}
              onClick={() => setMonth(shiftMonth(month, -1))}
            >
              <CaretLeftIcon aria-hidden />
            </Button>
            <span className="flex-1 text-center text-sm tabular-nums sm:min-w-36 sm:flex-none">
              {monthLabel}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label={t("budget.month.next")}
              onClick={() => setMonth(shiftMonth(month, 1))}
            >
              <CaretRightIcon aria-hidden />
            </Button>
          </div>

          <CreateBudgetDialog month={month} />
        </div>
      </header>

      {/* The month card answers "is there money left"; the list below is what
          set those limits. A refetch holds the previous figures at reduced
          opacity rather than dropping the card and shoving the list upward. */}
      <div
        className={`pb-6 transition-opacity ${
          monthQuery.isFetching ? "opacity-60" : ""
        }`}
      >
        {monthQuery.isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <BudgetMonthCard
            budgets={progress.filter(
              (row) => row.currencyCode === activeCurrency,
            )}
            totals={activeTotals ?? null}
            currencyCode={activeCurrency}
            monthLabel={monthLabel}
          />
        )}
      </div>

      <BudgetFilters filters={filters} onFiltersChange={setFilters} />

      {isPending ? (
        <div
          className="space-y-2"
          role="status"
          aria-label={t("budget.loading")}
        >
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>{t("budget.loadFailed")}</EmptyTitle>
            <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => void refetch()} disabled={isRefetching}>
              {isRefetching ? t("common.retrying") : t("common.retry")}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data.rows}
            getRowId={(budget) => budget.id}
            caption={t("budget.caption")}
            emptyState={
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>
                    {isFiltered
                      ? t("budget.emptyFiltered.title")
                      : t("budget.empty.title")}
                  </EmptyTitle>
                  <EmptyDescription>
                    {isFiltered
                      ? t("budget.emptyFiltered.description")
                      : t("budget.empty.description")}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            }
          />
          <Pagination
            page={page}
            total={data.total}
            onPageChange={setPage}
            isFetching={isFetching}
            resource="budgets"
          />
        </>
      )}
    </div>
  );
}
