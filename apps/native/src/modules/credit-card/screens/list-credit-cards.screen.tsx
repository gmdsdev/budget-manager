import {
  type CreditCardFiltersState,
  type CreditCardRow,
  EMPTY_CREDIT_CARD_FILTERS,
  isCreditCardFiltered,
} from "@budget-manager/client";
import { useCreditCardsQuery, usePagedFilters } from "@budget-manager/client/react";
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
import {
  CreateCreditCardSheet,
} from "@/modules/credit-card/components/create-credit-card-sheet";
import {
  CreditCardDetailSheet,
} from "@/modules/credit-card/components/credit-card-detail-sheet";
import {
  CreditCardFilters,
} from "@/modules/credit-card/components/credit-card-list/credit-card-filters";
import {
  CreditCardRows,
} from "@/modules/credit-card/components/credit-card-list/credit-card-rows";

export function ListCreditCardsScreen() {
  const t = useTranslate();
  const colors = useColors();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<CreditCardRow | null>(null);
  const { filters, page, setFilters, setPage } =
    usePagedFilters<CreditCardFiltersState>(EMPTY_CREDIT_CARD_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useCreditCardsQuery(filters, page);

  const isFiltered = isCreditCardFiltered(filters);

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      {/* No page title: the screen is named by the bar above it — the native header
          on a pushed screen, the tab bar on a tab. Repeating it costs a 32px row at
          the top of a phone and says nothing the reader cannot already see. */}
      <View style={{ paddingTop: SPACING.md }}>
        <Button
          label={t("creditCard.create.trigger")}
          leading={
            <Feather name="plus" size={16} color={colors.primaryForeground} />
          }
          onPress={() => setCreating(true)}
        />
      </View>

      <CreditCardFilters filters={filters} onFiltersChange={setFilters} />

      {isPending ? (
        <ListLoading label={t("creditCard.loading")} />
      ) : isError ? (
        <ListError
          title={t("creditCard.loadFailed")}
          error={error}
          onRetry={() => void refetch()}
          isRetrying={isRefetching}
        />
      ) : data.rows.length === 0 ? (
        <Empty
          title={
            isFiltered
              ? t("creditCard.emptyFiltered.title")
              : t("creditCard.empty.title")
          }
          description={
            isFiltered
              ? t("creditCard.emptyFiltered.description")
              : t("creditCard.empty.description")
          }
        />
      ) : (
        <>
          <CreditCardRows cards={data.rows} onSelect={setSelected} />
          <Pagination
            page={page}
            total={data.total}
            onPageChange={setPage}
            isFetching={isFetching}
            resource="cards"
          />

          {selected && (
            <CreditCardDetailSheet
              key={selected.id}
              card={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </>
      )}

      <CreateCreditCardSheet open={creating} onOpenChange={setCreating} />
    </Screen>
  );
}
