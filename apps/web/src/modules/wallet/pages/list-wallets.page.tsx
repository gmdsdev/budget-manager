import { DataTable } from "@/components/data-table";
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
import { useTranslate } from "@budget-manager/i18n/react";
import { CreateWalletDialog } from "../components/create-wallet-dialog";
import { useWalletColumns } from "../components/wallet-list/columns";
import { WalletFilters } from "../components/wallet-list/wallet-filters";
import { useWalletsQuery } from "@budget-manager/client/react";
import {
  EMPTY_WALLET_FILTERS,
  isWalletFiltered,
  type WalletFiltersState,
} from "@budget-manager/client";

export default function ListWalletsPage() {
  const t = useTranslate();
  const columns = useWalletColumns();
  const { filters, page, setFilters, setPage } =
    usePagedFilters<WalletFiltersState>(EMPTY_WALLET_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useWalletsQuery(filters, page);

  const isFiltered = isWalletFiltered(filters);

  return (
    <div>
      <header className="flex flex-col gap-3 pt-6 pb-4 sm:pt-10 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-wide uppercase sm:text-2xl">
          {t("wallet.title")}
        </h1>
        <CreateWalletDialog />
      </header>

      <WalletFilters filters={filters} onFiltersChange={setFilters} />

      {isPending ? (
        <div className="space-y-2" role="status" aria-label={t("wallet.loading")}>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>{t("wallet.loadFailed")}</EmptyTitle>
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
            getRowId={(wallet) => wallet.id}
            caption={t("wallet.caption")}
            emptyState={
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>
                    {isFiltered
                      ? t("wallet.emptyFiltered.title")
                      : t("wallet.empty.title")}
                  </EmptyTitle>
                  <EmptyDescription>
                    {isFiltered
                      ? t("wallet.emptyFiltered.description")
                      : t("wallet.empty.description")}
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
            resource="wallets"
          />
        </>
      )}
    </div>
  );
}
