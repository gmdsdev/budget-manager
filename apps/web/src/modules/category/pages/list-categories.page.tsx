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
import { CategoryTypeFilter } from "../components/category-list/category-type-filter";
import { categoryColumns } from "../components/category-list/columns";
import { CreateCategoryDialog } from "../components/create-category-dialog";
import { useCategoriesQuery } from "../queries/use-categories-query";
import {
  CATEGORY_TYPE_FILTER_ALL,
  type CategoryTypeFilterValue,
} from "../types";

export default function ListCategoriesPage() {
  const { filters, page, setFilters, setPage } =
    usePagedFilters<CategoryTypeFilterValue>(CATEGORY_TYPE_FILTER_ALL);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useCategoriesQuery({
      type: filters === CATEGORY_TYPE_FILTER_ALL ? undefined : filters,
      page,
    });

  return (
    <div>
      <header className="flex flex-row items-center justify-between py-4">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <CreateCategoryDialog />
      </header>

      <div className="flex flex-row items-center justify-end pb-4">
        <CategoryTypeFilter value={filters} onValueChange={setFilters} />
      </div>

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
                    {filters === CATEGORY_TYPE_FILTER_ALL
                      ? "No categories yet"
                      : "No categories match this type"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {filters === CATEGORY_TYPE_FILTER_ALL
                      ? "Create your first category to classify your transactions."
                      : "Try a different type, or create a category for it."}
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
