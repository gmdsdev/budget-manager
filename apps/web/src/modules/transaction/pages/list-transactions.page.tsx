import { DataTable } from "@/components/data-table";
import { useI18n } from "@budget-manager/i18n/react";
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
import { CreateCardPaymentDialog } from "../components/create-card-payment-dialog";
import { CreateCardPurchaseDialog } from "../components/create-card-purchase-dialog";
import { CreateTransactionDialog } from "../components/create-transaction-dialog";
import { CreateTransferDialog } from "../components/create-transfer-dialog";
import { useTransactionColumns } from "../components/transaction-list/columns";
import { TransactionFilters } from "../components/transaction-list/transaction-filters";
import { TransactionSummary } from "../components/transaction-list/transaction-summary";
import { useTransactionSummaryQuery } from "@budget-manager/client/react";
import { useTransactionsQuery } from "@budget-manager/client/react";
import {
  defaultTransactionFilters,
  isTransactionFiltered,
  type TransactionFiltersState,
} from "@budget-manager/client";

export default function ListTransactionsPage() {
  const { t, formatDateString } = useI18n();
  const columns = useTransactionColumns();
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
      <header className="flex flex-col gap-3 pt-6 pb-4 sm:pt-10 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-wide uppercase sm:text-2xl">
          {t("transaction.title")}
        </h1>
        {/* Four ways to record something: two per row on a phone, one row at
            sm and up. */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-center">
          <CreateCardPurchaseDialog />
          <CreateCardPaymentDialog />
          <CreateTransferDialog />
          <CreateTransactionDialog />
        </div>
      </header>

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
          <DataTable
            columns={columns}
            data={data.rows}
            getRowId={(transaction) => transaction.id}
            groupBy={(transaction) => transaction.occurrenceDate}
            groupHeader={(date) => formatDateString(date, "numeric")}
            caption={t("transaction.caption")}
            emptyState={
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
            }
          />
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
        </>
      )}
    </div>
  );
}
