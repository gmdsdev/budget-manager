import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/pagination";
import { usePagedFilters } from "@/hooks/use-paged-filters";
import { getErrorMessage } from "@/utils/error-message";
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
import { transactionColumns } from "../components/transaction-list/columns";
import { TransactionFilters } from "../components/transaction-list/transaction-filters";
import { useTransactionsQuery } from "../queries/use-transactions-query";
import {
  defaultTransactionFilters,
  isTransactionFiltered,
  type TransactionFiltersState,
} from "../types";

export default function ListTransactionsPage() {
  const { filters, page, setFilters, setPage } =
    usePagedFilters<TransactionFiltersState>(defaultTransactionFilters());

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useTransactionsQuery(filters, page);

  const isFiltered = isTransactionFiltered(filters);

  return (
    <div>
      <header className="flex flex-col gap-3 pt-6 pb-4 sm:pt-10 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-wide uppercase sm:text-2xl">Transactions</h1>
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
          aria-label="Loading transactions"
        >
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Couldn't load your transactions</EmptyTitle>
            <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => void refetch()} disabled={isRefetching}>
              {isRefetching ? "Retrying…" : "Retry"}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <DataTable
            columns={transactionColumns}
            data={data.rows}
            getRowId={(transaction) => transaction.id}
            caption="Your transactions"
            emptyState={
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>
                    {isFiltered
                      ? "No transactions match these filters"
                      : "No transactions yet"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {isFiltered
                      ? "Try widening the date range or clearing a filter."
                      : "Record your first income or expense to start tracking."}
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
            label="transactions"
          />
        </>
      )}
    </div>
  );
}
