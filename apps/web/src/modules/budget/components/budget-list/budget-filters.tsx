import { FilterBar } from "@/components/filter-bar";
import { FilterSearch } from "@/components/filter-search";
import { FilterSelect, type FilterItem } from "@/components/filter-select";
import { categoryColorVar } from "@/modules/category/colors";
import { useCategoryOptionsQuery } from "@budget-manager/client/react";
import { useEnumLabels } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { CategoryType, WalletCurrency } from "@budget-manager/schemas";
import {
  BUDGET_CATEGORY_FILTER_ALL,
  BUDGET_CURRENCY_FILTER_ALL,
  BUDGET_STATE_ACTIVE,
  BUDGET_STATE_FILTER_ALL,
  BUDGET_STATE_PAUSED,
  EMPTY_BUDGET_FILTERS,
  isBudgetFiltered,
  type BudgetFiltersState,
  type BudgetStateFilterValue,
} from "@budget-manager/client";

export function BudgetFilters({
  filters,
  onFiltersChange,
}: {
  filters: BudgetFiltersState;
  onFiltersChange: (filters: BudgetFiltersState) => void;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const { data: categories } = useCategoryOptionsQuery(CategoryType.EXPENSE);

  const categoryItems: FilterItem[] = [
    {
      label: t("budget.filter.allCategories"),
      value: BUDGET_CATEGORY_FILTER_ALL,
      color: null,
    },
    ...(categories ?? []).map((category) => ({
      label: category.name,
      value: category.id,
      color: categoryColorVar(category.color),
    })),
  ];

  const currencyItems: FilterItem[] = [
    {
      label: t("budget.filter.allCurrencies"),
      value: BUDGET_CURRENCY_FILTER_ALL,
    },
    ...Object.values(WalletCurrency).map((currency) => ({
      label: labels.currency(currency),
      value: currency,
    })),
  ];

  const stateItems: FilterItem[] = [
    { label: t("budget.filter.allStates"), value: BUDGET_STATE_FILTER_ALL },
    { label: t("budget.repeats.active"), value: BUDGET_STATE_ACTIVE },
    { label: t("budget.repeats.paused"), value: BUDGET_STATE_PAUSED },
  ];

  function patch(next: Partial<BudgetFiltersState>) {
    onFiltersChange({ ...filters, ...next });
  }

  return (
    <FilterBar
      isFiltered={isBudgetFiltered(filters)}
      onClear={() => onFiltersChange(EMPTY_BUDGET_FILTERS)}
    >
      <FilterSearch
        id="budget-category-search"
        label={t("common.category")}
        value={filters.search}
        onValueChange={(search) => patch({ search })}
      />

      <FilterSelect
        id="budget-category-filter"
        label={t("common.category")}
        items={categoryItems}
        value={filters.categoryId}
        onValueChange={(categoryId) => patch({ categoryId })}
      />

      <FilterSelect
        id="budget-currency-filter"
        label={t("common.currency")}
        items={currencyItems}
        value={filters.currencyCode}
        onValueChange={(currencyCode) => patch({ currencyCode })}
      />

      <FilterSelect
        id="budget-state-filter"
        label={t("common.status")}
        items={stateItems}
        value={filters.state}
        onValueChange={(value) =>
          patch({ state: value as BudgetStateFilterValue })
        }
      />
    </FilterBar>
  );
}
