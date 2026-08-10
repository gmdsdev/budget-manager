import {
  EMPTY_WALLET_FILTERS,
  isWalletFiltered,
  type WalletFiltersState,
  type WalletRow,
} from "@budget-manager/client";
import { usePagedFilters, useWalletsQuery } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { View } from "react-native";

import { ListError, ListLoading } from "@/components/list-state";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Pagination } from "@/components/ui/pagination";
import { Screen } from "@/components/ui/screen";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

import { CreateWalletSheet } from "../components/create-wallet-sheet";
import { WalletDetailSheet } from "../components/wallet-detail-sheet";
import { WalletFilters } from "../components/wallet-list/wallet-filters";
import { WalletRows } from "../components/wallet-list/wallet-rows";

export function ListWalletsScreen() {
  const t = useTranslate();
  const colors = useColors();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<WalletRow | null>(null);
  const { filters, page, setFilters, setPage } =
    usePagedFilters<WalletFiltersState>(EMPTY_WALLET_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useWalletsQuery(filters, page);

  const isFiltered = isWalletFiltered(filters);

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      {/* No page title: the screen is named by the bar above it — the native header
          on a pushed screen, the tab bar on a tab. Repeating it costs a 32px row at
          the top of a phone and says nothing the reader cannot already see. */}
      <View style={{ paddingTop: SPACING.md }}>
        <Button
          label={t("wallet.create.trigger")}
          leading={
            <Feather name="plus" size={16} color={colors.primaryForeground} />
          }
          onPress={() => setCreating(true)}
        />
      </View>

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
          <WalletRows wallets={data.rows} onSelect={setSelected} />
          <Pagination
            page={page}
            total={data.total}
            onPageChange={setPage}
            isFetching={isFetching}
            resource="wallets"
          />

          {selected && (
            <WalletDetailSheet
              key={selected.id}
              wallet={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </>
      )}

      <CreateWalletSheet open={creating} onOpenChange={setCreating} />
    </Screen>
  );
}
