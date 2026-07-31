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
import { CreateWalletDialog } from "../components/create-wallet-dialog";
import { walletColumns } from "../components/wallet-list/columns";
import { WalletFilters } from "../components/wallet-list/wallet-filters";
import { useWalletsQuery } from "../queries/use-wallets-query";
import {
  EMPTY_WALLET_FILTERS,
  isWalletFiltered,
  type WalletFiltersState,
} from "../types";

export default function ListWalletsPage() {
  const { filters, page, setFilters, setPage } =
    usePagedFilters<WalletFiltersState>(EMPTY_WALLET_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useWalletsQuery(filters, page);

  const isFiltered = isWalletFiltered(filters);

  return (
    <div>
      <header className="flex flex-col gap-3 pt-6 pb-4 sm:pt-10 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-wide uppercase sm:text-2xl">Wallets</h1>
        <CreateWalletDialog />
      </header>

      <WalletFilters filters={filters} onFiltersChange={setFilters} />

      {isPending ? (
        <div className="space-y-2" role="status" aria-label="Loading wallets">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Couldn't load your wallets</EmptyTitle>
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
            columns={walletColumns}
            data={data.rows}
            getRowId={(wallet) => wallet.id}
            caption="Your wallets"
            emptyState={
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>
                    {isFiltered
                      ? "No wallets match these filters"
                      : "No wallets yet"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {isFiltered
                      ? "Try a different type or currency, or clear a filter."
                      : "Create your first wallet to start tracking your finances."}
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
            label="wallets"
          />
        </>
      )}
    </div>
  );
}
