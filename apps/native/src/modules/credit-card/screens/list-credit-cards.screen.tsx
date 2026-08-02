import {
  type CreditCardFiltersState,
  EMPTY_CREDIT_CARD_FILTERS,
  isCreditCardFiltered,
} from "@budget-manager/client";
import { useCreditCardsQuery, usePagedFilters } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { useState } from "react";

import { ListError, ListLoading } from "@/components/list-state";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Pagination } from "@/components/ui/pagination";
import { RowCardList } from "@/components/ui/row-card";
import { PageHeader, Screen } from "@/components/ui/screen";
import {
  CreateCreditCardSheet,
} from "@/modules/credit-card/components/create-credit-card-sheet";
import {
  CreditCardFilters,
} from "@/modules/credit-card/components/credit-card-list/credit-card-filters";
import {
  CreditCardRowCard,
} from "@/modules/credit-card/components/credit-card-list/credit-card-row-card";

export function ListCreditCardsScreen() {
  const t = useTranslate();
  const [creating, setCreating] = useState(false);
  const { filters, page, setFilters, setPage } =
    usePagedFilters<CreditCardFiltersState>(EMPTY_CREDIT_CARD_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useCreditCardsQuery(filters, page);

  const isFiltered = isCreditCardFiltered(filters);

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <PageHeader title={t("creditCard.title")}>
        <Button
          label={t("creditCard.create.trigger")}
          onPress={() => setCreating(true)}
        />
      </PageHeader>

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
          <RowCardList>
            {data.rows.map((card) => (
              <CreditCardRowCard key={card.id} card={card} />
            ))}
          </RowCardList>
          <Pagination
            page={page}
            total={data.total}
            onPageChange={setPage}
            isFetching={isFetching}
            resource="cards"
          />
        </>
      )}

      <CreateCreditCardSheet open={creating} onOpenChange={setCreating} />
    </Screen>
  );
}
