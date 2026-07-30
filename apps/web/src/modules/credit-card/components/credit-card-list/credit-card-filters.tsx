import { FilterBar } from "@/components/filter-bar";
import { FilterSearch } from "@/components/filter-search";
import { FilterSelect, type FilterItem } from "@/components/filter-select";
import { useWalletOptionsQuery } from "@/modules/wallet/queries/use-wallet-options-query";
import {
  FILTER_NONE,
  WalletCurrency,
  WalletCurrencyLabelMap,
} from "@budget-manager/schemas";
import {
  CREDIT_CARD_FILTER_ALL,
  EMPTY_CREDIT_CARD_FILTERS,
  isCreditCardFiltered,
  type CreditCardFiltersState,
} from "../../types";

const CURRENCY_ITEMS: FilterItem[] = [
  { label: "All currencies", value: CREDIT_CARD_FILTER_ALL },
  ...Object.values(WalletCurrency).map((currency) => ({
    label: WalletCurrencyLabelMap[currency],
    value: currency,
  })),
];

export function CreditCardFilters({
  filters,
  onFiltersChange,
}: {
  filters: CreditCardFiltersState;
  onFiltersChange: (filters: CreditCardFiltersState) => void;
}) {
  const { data: wallets } = useWalletOptionsQuery();

  const walletItems: FilterItem[] = [
    { label: "All wallets", value: CREDIT_CARD_FILTER_ALL },
    { label: "No billing wallet", value: FILTER_NONE },
    ...(wallets ?? []).map((wallet) => ({
      label: wallet.name,
      value: wallet.id,
    })),
  ];

  function patch(next: Partial<CreditCardFiltersState>) {
    onFiltersChange({ ...filters, ...next });
  }

  return (
    <FilterBar
      isFiltered={isCreditCardFiltered(filters)}
      onClear={() => onFiltersChange(EMPTY_CREDIT_CARD_FILTERS)}
    >
      <FilterSearch
        id="credit-card-name-filter"
        label="Name"
        value={filters.search}
        onValueChange={(search) => patch({ search })}
      />

      <FilterSelect
        id="credit-card-currency-filter"
        label="Currency"
        items={CURRENCY_ITEMS}
        value={filters.currencyCode}
        onValueChange={(value) =>
          patch({
            currencyCode: value as CreditCardFiltersState["currencyCode"],
          })
        }
      />

      <FilterSelect
        id="credit-card-billing-wallet-filter"
        label="Billing wallet"
        items={walletItems}
        value={filters.defaultBillingWalletId}
        onValueChange={(value) => patch({ defaultBillingWalletId: value })}
      />
    </FilterBar>
  );
}
