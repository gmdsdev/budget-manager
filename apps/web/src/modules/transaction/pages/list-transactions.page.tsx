import { useTranslate } from "@budget-manager/i18n/react";
import { Pagination } from "@/components/pagination";
import { usePagedFilters } from "@budget-manager/client/react";
import { getErrorMessage } from "@budget-manager/client";
import { Button } from "@budget-manager/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@budget-manager/ui/components/empty";
import { Skeleton } from "@budget-manager/ui/components/skeleton";
import { CreateTransactionMenu } from "../components/create-transaction-menu";
import { TransactionFilters } from "../components/transaction-list/transaction-filters";
import { TransactionRows } from "../components/transaction-list/transaction-rows";
import { TransactionSummary } from "../components/transaction-list/transaction-summary";
import { useTransactionSummaryQuery } from "@budget-manager/client/react";
import { useTransactionsQuery } from "@budget-manager/client/react";
import {
  defaultTransactionFilters,
  isTransactionFiltered,
  type TransactionFiltersState,
  type TransactionRow,
} from "@budget-manager/client";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { TransactionDetailDialog } from "../components/transaction-detail-dialog";

export default function ListTransactionsPage() {
  const t = useTranslate();
  const [selected, setSelected] = useState<TransactionRow | null>(null);
  const { filters, page, setFilters, setPage } =
    usePagedFilters<TransactionFiltersState>(defaultTransactionFilters());

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useTransactionsQuery(filters, page);

  // Its own query, keyed on the filters alone: the totals cover every matching
  // row, so turning a page must not refetch them.
  const summary = useTransactionSummaryQuery(filters);

  const isFiltered = isTransactionFiltered(filters);

  return (
    <div>
      <PageHeader title={t("transaction.title")}>
        <CreateTransactionMenu />
      </PageHeader>

      <TransactionFilters filters={filters} onFiltersChange={setFilters} />

      {isPending ? (
        <div
          className="space-y-2"
          role="status"
          aria-label={t("transaction.loading")}
        >
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>{t("transaction.loadFailed")}</EmptyTitle>
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
          {data.rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>
                  {isFiltered
                    ? t("transaction.emptyFiltered.title")
                    : t("transaction.empty.title")}
                </EmptyTitle>
                <EmptyDescription>
                  {isFiltered
                    ? t("transaction.emptyFiltered.description")
                    : t("transaction.empty.description")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <TransactionRows transactions={data.rows} onSelect={setSelected} />
          )}
          {summary.data ? (
            <TransactionSummary
              currencies={summary.data.currencies}
              rangeTo={filters.dateTo}
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

          {/* Keyed on the row, so reopening on a different transaction starts
              the detail view fresh rather than reusing the last one's state. */}
          {selected && (
            <TransactionDetailDialog
              key={selected.id}
              transaction={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
