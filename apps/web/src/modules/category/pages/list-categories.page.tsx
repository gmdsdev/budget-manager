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
import { CategoryFilters } from "../components/category-list/category-filters";
import { categoryColumns } from "../components/category-list/columns";
import { CreateCategoryDialog } from "../components/create-category-dialog";
import { useCategoriesQuery } from "../queries/use-categories-query";
import {
  EMPTY_CATEGORY_FILTERS,
  isCategoryFiltered,
  type CategoryFiltersState,
} from "../types";

export default function ListCategoriesPage() {
  const { filters, page, setFilters, setPage } =
    usePagedFilters<CategoryFiltersState>(EMPTY_CATEGORY_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useCategoriesQuery(filters, page);

  const isFiltered = isCategoryFiltered(filters);

  return (
    <div>
      <header className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold sm:text-2xl">Categories</h1>
        <CreateCategoryDialog />
      </header>

      <CategoryFilters filters={filters} onFiltersChange={setFilters} />

      {isPending ? (
        <div
          className="space-y-2"
          role="status"
          aria-label="Loading categories"
        >
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Couldn't load your categories</EmptyTitle>
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
            columns={categoryColumns}
            data={data.rows}
            getRowId={(category) => category.id}
            caption="Your categories"
            emptyState={
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>
                    {isFiltered
                      ? "No categories match these filters"
                      : "No categories yet"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {isFiltered
                      ? "Try a different type or name, or create a category for it."
                      : "Create your first category to classify your transactions."}
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
            label="categories"
          />
        </>
      )}
    </div>
  );
}
