import { FilterBar } from "@/components/filter-bar";
import { FilterSearch } from "@/components/filter-search";
import { FilterSelect, type FilterItem } from "@/components/filter-select";
import { useEnumLabels } from "@/lib/enum-labels";
import { useTranslate } from "@budget-manager/i18n/react";
import { CategoryType } from "@budget-manager/schemas";
import {
  CATEGORY_TYPE_FILTER_ALL,
  EMPTY_CATEGORY_FILTERS,
  isCategoryFiltered,
  type CategoryFiltersState,
  type CategoryTypeFilterValue,
} from "../../types";

export function CategoryFilters({
  filters,
  onFiltersChange,
}: {
  filters: CategoryFiltersState;
  onFiltersChange: (filters: CategoryFiltersState) => void;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();

  const typeItems: FilterItem[] = [
    { label: t("category.filter.allTypes"), value: CATEGORY_TYPE_FILTER_ALL },
    ...Object.values(CategoryType).map((type) => ({
      label: labels.categoryType(type),
      value: type,
    })),
  ];

  function patch(next: Partial<CategoryFiltersState>) {
    onFiltersChange({ ...filters, ...next });
  }

  return (
    <FilterBar
      isFiltered={isCategoryFiltered(filters)}
      onClear={() => onFiltersChange(EMPTY_CATEGORY_FILTERS)}
    >
      <FilterSearch
        id="category-name-filter"
        label={t("common.name")}
        value={filters.search}
        onValueChange={(search) => patch({ search })}
      />

      <FilterSelect
        id="category-type-filter"
        label={t("common.type")}
        items={typeItems}
        value={filters.type}
        onValueChange={(value) =>
          patch({ type: value as CategoryTypeFilterValue })
        }
      />
    </FilterBar>
  );
}
