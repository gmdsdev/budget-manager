import {
  EMPTY_WALLET_FILTERS,
  isWalletFiltered,
  WALLET_FILTER_ALL,
  type WalletFiltersState,
} from "@budget-manager/client";
import { useEnumLabels } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { WalletCurrency, WalletType } from "@budget-manager/schemas";

import { FilterBar } from "@/components/filter-bar";
import { FilterSearch } from "@/components/filter-search";
import { type FilterItem, FilterSelect } from "@/components/filter-select";

export function WalletFilters({
  filters,
  onFiltersChange,
}: {
  filters: WalletFiltersState;
  onFiltersChange: (filters: WalletFiltersState) => void;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();

  const typeItems: FilterItem[] = [
    { label: t("wallet.filter.allTypes"), value: WALLET_FILTER_ALL },
    ...Object.values(WalletType).map((type) => ({
      label: labels.walletType(type),
      value: type,
    })),
  ];

  const currencyItems: FilterItem[] = [
    { label: t("wallet.filter.allCurrencies"), value: WALLET_FILTER_ALL },
    ...Object.values(WalletCurrency).map((currency) => ({
      label: labels.currency(currency),
      value: currency,
    })),
  ];

  function patch(next: Partial<WalletFiltersState>) {
    onFiltersChange({ ...filters, ...next });
  }

  return (
    <FilterBar
      isFiltered={isWalletFiltered(filters)}
      onClear={() => onFiltersChange(EMPTY_WALLET_FILTERS)}
    >
      <FilterSearch
        label={t("common.name")}
        value={filters.search}
        onValueChange={(search) => patch({ search })}
      />
      <FilterSelect
        label={t("common.type")}
        items={typeItems}
        value={filters.type}
        onValueChange={(value) => patch({ type: value as WalletFiltersState["type"] })}
      />
      <FilterSelect
        label={t("common.currency")}
        items={currencyItems}
        value={filters.currencyCode}
        onValueChange={(value) =>
          patch({ currencyCode: value as WalletFiltersState["currencyCode"] })
        }
      />
    </FilterBar>
  );
}
