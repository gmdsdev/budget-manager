import { FilterBar } from "@/components/filter-bar";
import { FilterSearch } from "@/components/filter-search";
import { FilterSelect, type FilterItem } from "@/components/filter-select";
import { CategoryType, CategoryTypeLabelMap } from "@budget-manager/schemas";
import {
  CATEGORY_TYPE_FILTER_ALL,
  EMPTY_CATEGORY_FILTERS,
  isCategoryFiltered,
  type CategoryFiltersState,
  type CategoryTypeFilterValue,
} from "../../types";

const TYPE_ITEMS: FilterItem[] = [
  { label: "All types", value: CATEGORY_TYPE_FILTER_ALL },
  ...Object.values(CategoryType).map((type) => ({
    label: CategoryTypeLabelMap[type],
    value: type,
  })),
];

export function CategoryFilters({
  filters,
  onFiltersChange,
}: {
  filters: CategoryFiltersState;
  onFiltersChange: (filters: CategoryFiltersState) => void;
}) {
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
        label="Name"
        value={filters.search}
        onValueChange={(search) => patch({ search })}
      />

      <FilterSelect
        id="category-type-filter"
        label="Type"
        items={TYPE_ITEMS}
        value={filters.type}
        onValueChange={(value) =>
          patch({ type: value as CategoryTypeFilterValue })
        }
      />
    </FilterBar>
  );
}
