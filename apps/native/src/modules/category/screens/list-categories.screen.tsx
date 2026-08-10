import {
  type CategoryFiltersState,
  type CategoryRow,
  EMPTY_CATEGORY_FILTERS,
  isCategoryFiltered,
} from "@budget-manager/client";
import { useCategoriesQuery, usePagedFilters } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { View } from "react-native";

import { ListError, ListLoading } from "@/components/list-state";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Pagination } from "@/components/ui/pagination";
import { Screen } from "@/components/ui/screen";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

import { CategoryDetailSheet } from "../components/category-detail-sheet";
import { CategoryFilters } from "../components/category-list/category-filters";
import { CategoryRows } from "../components/category-list/category-rows";
import { CreateCategorySheet } from "../components/create-category-sheet";

export function ListCategoriesScreen() {
  const t = useTranslate();
  const colors = useColors();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<CategoryRow | null>(null);
  const { filters, page, setFilters, setPage } =
    usePagedFilters<CategoryFiltersState>(EMPTY_CATEGORY_FILTERS);

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useCategoriesQuery(filters, page);

  const isFiltered = isCategoryFiltered(filters);

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      {/* No page title: the screen is named by the bar above it — the native header
          on a pushed screen, the tab bar on a tab. Repeating it costs a 32px row at
          the top of a phone and says nothing the reader cannot already see. */}
      <View style={{ paddingTop: SPACING.md }}>
        <Button
          label={t("category.create.trigger")}
          leading={
            <Feather name="plus" size={16} color={colors.primaryForeground} />
          }
          onPress={() => setCreating(true)}
        />
      </View>

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
          <CategoryRows categories={data.rows} onSelect={setSelected} />
          <Pagination
            page={page}
            total={data.total}
            onPageChange={setPage}
            isFetching={isFetching}
            resource="categories"
          />

          {selected && (
            <CategoryDetailSheet
              key={selected.id}
              category={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </>
      )}

      <CreateCategorySheet open={creating} onOpenChange={setCreating} />
    </Screen>
  );
}
