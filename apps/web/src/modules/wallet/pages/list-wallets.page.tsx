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
import { WalletFilters } from "../components/wallet-list/wallet-filters";
import { useWalletsQuery } from "@budget-manager/client/react";
import {
  EMPTY_WALLET_FILTERS,
  isWalletFiltered,
  type WalletFiltersState,
  type WalletRow,
} from "@budget-manager/client";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { WalletDetailDialog } from "../components/wallet-detail-dialog";
import { WalletRows } from "../components/wallet-list/wallet-rows";

export default function ListWalletsPage() {
  const t = useTranslate();
  const [selected, setSelected] = useState<WalletRow | null>(null);
  const { filters, page, setFilters, setPage } =
    usePagedFilters<WalletFiltersState>(EMPTY_WALLET_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useWalletsQuery(filters, page);

  const isFiltered = isWalletFiltered(filters);

  return (
    <div>
      <PageHeader title={t("wallet.title")}>
        <CreateWalletDialog />
      </PageHeader>

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
          {data.rows.length === 0 ? (
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
          ) : (
            <WalletRows wallets={data.rows} onSelect={setSelected} />
          )}
          <Pagination
            page={page}
            total={data.total}
            onPageChange={setPage}
            isFetching={isFetching}
            resource="wallets"
          />

          {selected && (
            <WalletDetailDialog
              key={selected.id}
              wallet={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
