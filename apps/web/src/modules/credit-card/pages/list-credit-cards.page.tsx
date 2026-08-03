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
import { CreditCardFilters } from "../components/credit-card-list/credit-card-filters";
import { CreateCreditCardDialog } from "../components/create-credit-card-dialog";
import { useCreditCardsQuery } from "@budget-manager/client/react";
import {
  EMPTY_CREDIT_CARD_FILTERS,
  isCreditCardFiltered,
  type CreditCardFiltersState,
  type CreditCardRow,
} from "@budget-manager/client";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { CreditCardDetailDialog } from "../components/credit-card-detail-dialog";
import { CreditCardRows } from "../components/credit-card-list/credit-card-rows";

export default function ListCreditCardsPage() {
  const t = useTranslate();
  const [selected, setSelected] = useState<CreditCardRow | null>(null);
  const { filters, page, setFilters, setPage } =
    usePagedFilters<CreditCardFiltersState>(EMPTY_CREDIT_CARD_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useCreditCardsQuery(filters, page);

  const isFiltered = isCreditCardFiltered(filters);

  return (
    <div>
      <PageHeader title={t("creditCard.title")}>
        <CreateCreditCardDialog />
      </PageHeader>

      <CreditCardFilters filters={filters} onFiltersChange={setFilters} />

      {isPending ? (
        <div className="space-y-2" role="status" aria-label={t("creditCard.loading")}>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>{t("creditCard.loadFailed")}</EmptyTitle>
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
                    ? t("creditCard.emptyFiltered.title")
                    : t("creditCard.empty.title")}
                </EmptyTitle>
                <EmptyDescription>
                  {isFiltered
                    ? t("creditCard.emptyFiltered.description")
                    : t("creditCard.empty.description")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <CreditCardRows cards={data.rows} onSelect={setSelected} />
          )}
          <Pagination
            page={page}
            total={data.total}
            onPageChange={setPage}
            isFetching={isFetching}
            resource="cards"
          />

          {selected && (
            <CreditCardDetailDialog
              key={selected.id}
              card={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
