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
import { useCreditCardColumns } from "../components/credit-card-list/columns";
import { CreditCardFilters } from "../components/credit-card-list/credit-card-filters";
import { CreateCreditCardDialog } from "../components/create-credit-card-dialog";
import { useCreditCardsQuery } from "@budget-manager/client/react";
import {
  EMPTY_CREDIT_CARD_FILTERS,
  isCreditCardFiltered,
  type CreditCardFiltersState,
} from "@budget-manager/client";

export default function ListCreditCardsPage() {
  const t = useTranslate();
  const columns = useCreditCardColumns();
  const { filters, page, setFilters, setPage } =
    usePagedFilters<CreditCardFiltersState>(EMPTY_CREDIT_CARD_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useCreditCardsQuery(filters, page);

  const isFiltered = isCreditCardFiltered(filters);

  return (
    <div>
      <header className="flex flex-col gap-3 pt-6 pb-4 sm:pt-10 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-wide uppercase sm:text-2xl">
          {t("creditCard.title")}
        </h1>
        <CreateCreditCardDialog />
      </header>

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
          <DataTable
            columns={columns}
            data={data.rows}
            getRowId={(card) => card.id}
            caption={t("creditCard.caption")}
            emptyState={
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
            }
          />
          <Pagination
            page={page}
            total={data.total}
            onPageChange={setPage}
            isFetching={isFetching}
            resource="cards"
          />
        </>
      )}
    </div>
  );
}
