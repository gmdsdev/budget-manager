import {
  EMPTY_WALLET_FILTERS,
  isWalletFiltered,
  type WalletFiltersState,
} from "@budget-manager/client";
import { usePagedFilters, useWalletsQuery } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { useState } from "react";

import { ListError, ListLoading } from "@/components/list-state";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Pagination } from "@/components/ui/pagination";
import { RowCardList } from "@/components/ui/row-card";
import { PageHeader, Screen } from "@/components/ui/screen";

import { CreateWalletSheet } from "../components/create-wallet-sheet";
import { WalletFilters } from "../components/wallet-list/wallet-filters";
import { WalletRowCard } from "../components/wallet-list/wallet-row-card";

export function ListWalletsScreen() {
  const t = useTranslate();
  const [creating, setCreating] = useState(false);
  const { filters, page, setFilters, setPage } =
    usePagedFilters<WalletFiltersState>(EMPTY_WALLET_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useWalletsQuery(filters, page);

  const isFiltered = isWalletFiltered(filters);

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <PageHeader title={t("wallet.title")}>
        <Button label={t("wallet.create.trigger")} onPress={() => setCreating(true)} />
      </PageHeader>

      <WalletFilters filters={filters} onFiltersChange={setFilters} />

      {isPending ? (
        <ListLoading label={t("wallet.loading")} />
      ) : isError ? (
        <ListError
          title={t("wallet.loadFailed")}
          error={error}
          onRetry={() => void refetch()}
          isRetrying={isRefetching}
        />
      ) : data.rows.length === 0 ? (
        <Empty
          title={isFiltered ? t("wallet.emptyFiltered.title") : t("wallet.empty.title")}
          description={
            isFiltered
              ? t("wallet.emptyFiltered.description")
              : t("wallet.empty.description")
          }
        />
      ) : (
        <>
          <RowCardList>
            {data.rows.map((wallet) => (
              <WalletRowCard key={wallet.id} wallet={wallet} />
            ))}
          </RowCardList>
          <Pagination
            page={page}
            total={data.total}
            onPageChange={setPage}
            isFetching={isFetching}
            resource="wallets"
          />
        </>
      )}

      <CreateWalletSheet open={creating} onOpenChange={setCreating} />
    </Screen>
  );
}
