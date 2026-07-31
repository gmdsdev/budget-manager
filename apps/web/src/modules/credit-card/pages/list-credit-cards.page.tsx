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
import { creditCardColumns } from "../components/credit-card-list/columns";
import { CreditCardFilters } from "../components/credit-card-list/credit-card-filters";
import { CreateCreditCardDialog } from "../components/create-credit-card-dialog";
import { useCreditCardsQuery } from "../queries/use-credit-cards-query";
import {
  EMPTY_CREDIT_CARD_FILTERS,
  isCreditCardFiltered,
  type CreditCardFiltersState,
} from "../types";

export default function ListCreditCardsPage() {
  const { filters, page, setFilters, setPage } =
    usePagedFilters<CreditCardFiltersState>(EMPTY_CREDIT_CARD_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useCreditCardsQuery(filters, page);

  const isFiltered = isCreditCardFiltered(filters);

  return (
    <div>
      <header className="flex flex-col gap-3 pt-6 pb-4 sm:pt-10 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-wide uppercase sm:text-2xl">Credit Cards</h1>
        <CreateCreditCardDialog />
      </header>

      <CreditCardFilters filters={filters} onFiltersChange={setFilters} />

      {isPending ? (
        <div className="space-y-2" role="status" aria-label="Loading cards">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Couldn't load your cards</EmptyTitle>
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
            columns={creditCardColumns}
            data={data.rows}
            getRowId={(card) => card.id}
            caption="Your credit cards"
            emptyState={
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>
                    {isFiltered
                      ? "No cards match these filters"
                      : "No cards yet"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {isFiltered
                      ? "Try a different currency or billing wallet, or clear a filter."
                      : "Add a card to track its limit and what you owe on it."}
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
            label="cards"
          />
        </>
      )}
    </div>
  );
}
