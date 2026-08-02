import {
  BUDGET_CATEGORY_FILTER_ALL,
  BUDGET_CURRENCY_FILTER_ALL,
  BUDGET_STATE_ACTIVE,
  BUDGET_STATE_FILTER_ALL,
  BUDGET_STATE_PAUSED,
  type BudgetFiltersState,
  type BudgetStateFilterValue,
  EMPTY_BUDGET_FILTERS,
  isBudgetFiltered,
} from "@budget-manager/client";
import { useCategoryOptionsQuery, useEnumLabels } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { CategoryType, WalletCurrency } from "@budget-manager/schemas";

import { FilterBar } from "@/components/filter-bar";
import { FilterSearch } from "@/components/filter-search";
import { type FilterItem, FilterSelect } from "@/components/filter-select";
import { useColors } from "@/theme/theme-provider";

export function BudgetFilters({
  filters,
  onFiltersChange,
}: {
  filters: BudgetFiltersState;
  onFiltersChange: (filters: BudgetFiltersState) => void;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const colors = useColors();
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
      color: colors.category[category.color],
    })),
  ];

  const currencyItems: FilterItem[] = [
    { label: t("budget.filter.allCurrencies"), value: BUDGET_CURRENCY_FILTER_ALL },
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
        label={t("common.category")}
        value={filters.search}
        onValueChange={(search) => patch({ search })}
      />
      <FilterSelect
        label={t("common.category")}
        items={categoryItems}
        value={filters.categoryId}
        onValueChange={(categoryId) => patch({ categoryId })}
      />
      <FilterSelect
        label={t("common.currency")}
        items={currencyItems}
        value={filters.currencyCode}
        onValueChange={(currencyCode) => patch({ currencyCode })}
      />
      <FilterSelect
        label={t("common.status")}
        items={stateItems}
        value={filters.state}
        onValueChange={(value) => patch({ state: value as BudgetStateFilterValue })}
      />
    </FilterBar>
  );
}
