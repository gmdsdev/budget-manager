import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/pagination";
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
import { useState } from "react";
import { creditCardColumns } from "../components/credit-card-list/columns";
import { CreateCreditCardDialog } from "../components/create-credit-card-dialog";
import { useCreditCardsQuery } from "../queries/use-credit-cards-query";

export default function ListCreditCardsPage() {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useCreditCardsQuery(page);

  return (
    <div>
      <header className="flex flex-row items-center justify-between py-4">
        <h1 className="text-2xl font-semibold">Credit Cards</h1>
        <CreateCreditCardDialog />
      </header>

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
                  <EmptyTitle>No cards yet</EmptyTitle>
                  <EmptyDescription>
                    Add a card to track its limit and what you owe on it.
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
