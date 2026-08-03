import {
  type CreditCardFiltersState,
  type CreditCardRow,
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
import { PageHeader, Screen } from "@/components/ui/screen";
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
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<CreditCardRow | null>(null);
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
