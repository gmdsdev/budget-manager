import {
  defaultTransactionFilters,
  isTransactionFiltered,
  type TransactionFiltersState,
  type TransactionRow,
} from "@budget-manager/client";
import {
  usePagedFilters,
  usePreferredCurrency,
  useTransactionsQuery,
  useTransactionSummaryQuery,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { useState } from "react";

import { ListError, ListLoading } from "@/components/list-state";
import { Empty } from "@/components/ui/empty";
import { Pagination } from "@/components/ui/pagination";
import { Screen } from "@/components/ui/screen";
import { TransactionDetailSheet } from "@/modules/transaction/components/transaction-detail-sheet";
import { TransactionFilters } from "@/modules/transaction/components/transaction-list/transaction-filters";
import { TransactionRows } from "@/modules/transaction/components/transaction-list/transaction-rows";
import { TransactionSummary } from "@/modules/transaction/components/transaction-list/transaction-summary";

export function ListTransactionsScreen() {
  const t = useTranslate();
  const [selected, setSelected] = useState<TransactionRow | null>(null);
  const preferredCurrency: string = usePreferredCurrency();
  const { filters, page, setFilters, setPage } =
    usePagedFilters<TransactionFiltersState>(defaultTransactionFilters());

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useTransactionsQuery(filters, page);

  // Its own query, keyed on the filters alone: the totals cover every matching row,
  // so turning a page must not refetch them.
  const summary = useTransactionSummaryQuery(filters);

  const isFiltered = isTransactionFiltered(filters);

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      {/* No page title: the screen is named by the bar above it — the native header
          on a pushed screen, the tab bar on a tab. Repeating it costs a 32px row at
          the top of a phone and says nothing the reader cannot already see. */}

      <TransactionFilters filters={filters} onFiltersChange={setFilters} />

      {isPending ? (
        <ListLoading label={t("transaction.loading")} />
      ) : isError ? (
        <ListError
          title={t("transaction.loadFailed")}
          error={error}
          onRetry={() => void refetch()}
          isRetrying={isRefetching}
        />
      ) : data.rows.length === 0 ? (
        <Empty
          title={
            isFiltered
              ? t("transaction.emptyFiltered.title")
              : t("transaction.empty.title")
          }
          description={
            isFiltered
              ? t("transaction.emptyFiltered.description")
              : t("transaction.empty.description")
          }
        />
      ) : (
        <>
          <TransactionRows transactions={data.rows} onSelect={setSelected} />

          {summary.data ? (
            <TransactionSummary
              currencies={summary.data.currencies}
              rangeTo={filters.dateTo}
              total={data.total}
              preferredCurrency={preferredCurrency}
              isFetching={summary.isFetching}
            />
          ) : null}

          <Pagination
            page={page}
            total={data.total}
            onPageChange={setPage}
            isFetching={isFetching}
            resource="transactions"
          />

          {/* Keyed on the row, so opening a different record rebuilds the sheet
              rather than carrying the previous one's nested state over. */}
          {selected && (
            <TransactionDetailSheet
              key={selected.id}
              transaction={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </>
      )}
    </Screen>
  );
}
