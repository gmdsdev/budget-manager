import { FilterBar } from "@/components/filter-bar";
import { FilterSearch } from "@/components/filter-search";
import { FilterSelect, type FilterItem } from "@/components/filter-select";
import {
  WalletCurrency,
  WalletCurrencyLabelMap,
  WalletType,
  WalletTypeLabelMap,
} from "@budget-manager/schemas";
import {
  EMPTY_WALLET_FILTERS,
  isWalletFiltered,
  WALLET_FILTER_ALL,
  type WalletFiltersState,
} from "../../types";

const TYPE_ITEMS: FilterItem[] = [
  { label: "All types", value: WALLET_FILTER_ALL },
  ...Object.values(WalletType).map((type) => ({
    label: WalletTypeLabelMap[type],
    value: type,
  })),
];

const CURRENCY_ITEMS: FilterItem[] = [
  { label: "All currencies", value: WALLET_FILTER_ALL },
  ...Object.values(WalletCurrency).map((currency) => ({
    label: WalletCurrencyLabelMap[currency],
    value: currency,
  })),
];

export function WalletFilters({
  filters,
  onFiltersChange,
}: {
  filters: WalletFiltersState;
  onFiltersChange: (filters: WalletFiltersState) => void;
}) {
  function patch(next: Partial<WalletFiltersState>) {
    onFiltersChange({ ...filters, ...next });
  }

  return (
    <FilterBar
      isFiltered={isWalletFiltered(filters)}
      onClear={() => onFiltersChange(EMPTY_WALLET_FILTERS)}
    >
      <FilterSearch
        id="wallet-name-filter"
        label="Name"
        value={filters.search}
        onValueChange={(search) => patch({ search })}
      />

      <FilterSelect
        id="wallet-type-filter"
        label="Type"
        items={TYPE_ITEMS}
        value={filters.type}
        onValueChange={(value) =>
          patch({ type: value as WalletFiltersState["type"] })
        }
      />

      <FilterSelect
        id="wallet-currency-filter"
        label="Currency"
        items={CURRENCY_ITEMS}
        value={filters.currencyCode}
        onValueChange={(value) =>
          patch({ currencyCode: value as WalletFiltersState["currencyCode"] })
        }
      />
    </FilterBar>
  );
}
