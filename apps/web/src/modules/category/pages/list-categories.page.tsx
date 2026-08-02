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
import { CategoryFilters } from "../components/category-list/category-filters";
import { useCategoryColumns } from "../components/category-list/columns";
import { CreateCategoryDialog } from "../components/create-category-dialog";
import { useCategoriesQuery } from "@budget-manager/client/react";
import {
  EMPTY_CATEGORY_FILTERS,
  isCategoryFiltered,
  type CategoryFiltersState,
} from "@budget-manager/client";

export default function ListCategoriesPage() {
  const t = useTranslate();
  const columns = useCategoryColumns();
  const { filters, page, setFilters, setPage } =
    usePagedFilters<CategoryFiltersState>(EMPTY_CATEGORY_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useCategoriesQuery(filters, page);

  const isFiltered = isCategoryFiltered(filters);

  return (
    <div>
      <header className="flex flex-col gap-3 pt-6 pb-4 sm:pt-10 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-wide uppercase sm:text-2xl">
          {t("category.title")}
        </h1>
        <CreateCategoryDialog />
      </header>

      <CategoryFilters filters={filters} onFiltersChange={setFilters} />

      {isPending ? (
        <div
          className="space-y-2"
          role="status"
          aria-label={t("category.loading")}
        >
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>{t("category.loadFailed")}</EmptyTitle>
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
            getRowId={(category) => category.id}
            caption={t("category.caption")}
            emptyState={
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>
                    {isFiltered
                      ? t("category.emptyFiltered.title")
                      : t("category.empty.title")}
                  </EmptyTitle>
                  <EmptyDescription>
                    {isFiltered
                      ? t("category.emptyFiltered.description")
                      : t("category.empty.description")}
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
            resource="categories"
          />
        </>
      )}
    </div>
  );
}
