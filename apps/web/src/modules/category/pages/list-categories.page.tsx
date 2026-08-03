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
import { CategoryDetailDialog } from "../components/category-detail-dialog";
import { CategoryFilters } from "../components/category-list/category-filters";
import { CategoryRows } from "../components/category-list/category-rows";
import { CreateCategoryDialog } from "../components/create-category-dialog";
import { useCategoriesQuery } from "@budget-manager/client/react";
import {
  EMPTY_CATEGORY_FILTERS,
  isCategoryFiltered,
  type CategoryFiltersState,
  type CategoryRow,
} from "@budget-manager/client";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";

export default function ListCategoriesPage() {
  const t = useTranslate();
  const [selected, setSelected] = useState<CategoryRow | null>(null);
  const { filters, page, setFilters, setPage } =
    usePagedFilters<CategoryFiltersState>(EMPTY_CATEGORY_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useCategoriesQuery(filters, page);

  const isFiltered = isCategoryFiltered(filters);

  return (
    <div>
      <PageHeader title={t("category.title")}>
        <CreateCategoryDialog />
      </PageHeader>

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
          {data.rows.length === 0 ? (
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
          ) : (
            <CategoryRows categories={data.rows} onSelect={setSelected} />
          )}
          <Pagination
            page={page}
            total={data.total}
            onPageChange={setPage}
            isFetching={isFetching}
            resource="categories"
          />

          {selected && (
            <CategoryDetailDialog
              key={selected.id}
              category={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
