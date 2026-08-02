import {
  type CategoryFiltersState,
  EMPTY_CATEGORY_FILTERS,
  isCategoryFiltered,
} from "@budget-manager/client";
import { useCategoriesQuery, usePagedFilters } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { useState } from "react";

import { ListError, ListLoading } from "@/components/list-state";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Pagination } from "@/components/ui/pagination";
import { RowCardList } from "@/components/ui/row-card";
import { PageHeader, Screen } from "@/components/ui/screen";

import { CategoryFilters } from "../components/category-list/category-filters";
import { CategoryRowCard } from "../components/category-list/category-row-card";
import { CreateCategorySheet } from "../components/create-category-sheet";

export function ListCategoriesScreen() {
  const t = useTranslate();
  const [creating, setCreating] = useState(false);
  const { filters, page, setFilters, setPage } =
    usePagedFilters<CategoryFiltersState>(EMPTY_CATEGORY_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useCategoriesQuery(filters, page);

  const isFiltered = isCategoryFiltered(filters);

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <PageHeader title={t("category.title")}>
        <Button label={t("category.create.trigger")} onPress={() => setCreating(true)} />
      </PageHeader>

      <CategoryFilters filters={filters} onFiltersChange={setFilters} />

      {isPending ? (
        <ListLoading label={t("category.loading")} />
      ) : isError ? (
        <ListError
          title={t("category.loadFailed")}
          error={error}
          onRetry={() => void refetch()}
          isRetrying={isRefetching}
        />
      ) : data.rows.length === 0 ? (
        <Empty
          title={
            isFiltered ? t("category.emptyFiltered.title") : t("category.empty.title")
          }
          description={
            isFiltered
              ? t("category.emptyFiltered.description")
              : t("category.empty.description")
          }
        />
      ) : (
        <>
          <RowCardList>
            {data.rows.map((category) => (
              <CategoryRowCard key={category.id} category={category} />
            ))}
          </RowCardList>
          <Pagination
            page={page}
            total={data.total}
            onPageChange={setPage}
            isFetching={isFetching}
            resource="categories"
          />
        </>
      )}

      <CreateCategorySheet open={creating} onOpenChange={setCreating} />
    </Screen>
  );
}
