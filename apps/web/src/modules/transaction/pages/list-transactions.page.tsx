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
  EMPTY_TRANSACTION_FILTERS,
  isTransactionFiltered,
  type TransactionFiltersState,
} from "../types";

export default function ListTransactionsPage() {
  const { filters, page, setFilters, setPage } =
    usePagedFilters<TransactionFiltersState>(EMPTY_TRANSACTION_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useTransactionsQuery(filters, page);

  const isFiltered = isTransactionFiltered(filters);

  return (
    <div>
      <header className="flex flex-row items-center justify-between py-4">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <div className="flex flex-row items-center gap-2">
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
