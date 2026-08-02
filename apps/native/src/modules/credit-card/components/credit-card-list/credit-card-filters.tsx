import {
  CREDIT_CARD_FILTER_ALL,
  type CreditCardFiltersState,
  EMPTY_CREDIT_CARD_FILTERS,
  isCreditCardFiltered,
} from "@budget-manager/client";
import { useEnumLabels, useWalletOptionsQuery } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { FILTER_NONE, WalletCurrency } from "@budget-manager/schemas";

import { FilterBar } from "@/components/filter-bar";
import { FilterSearch } from "@/components/filter-search";
import { type FilterItem, FilterSelect } from "@/components/filter-select";

export function CreditCardFilters({
  filters,
  onFiltersChange,
}: {
  filters: CreditCardFiltersState;
  onFiltersChange: (filters: CreditCardFiltersState) => void;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const { data: wallets } = useWalletOptionsQuery();

  const currencyItems: FilterItem[] = [
    { label: t("creditCard.filter.allCurrencies"), value: CREDIT_CARD_FILTER_ALL },
    ...Object.values(WalletCurrency).map((currency) => ({
      label: labels.currency(currency),
      value: currency,
    })),
  ];

  const walletItems: FilterItem[] = [
    { label: t("creditCard.filter.allWallets"), value: CREDIT_CARD_FILTER_ALL },
    // The shared sentinel for an empty column, which the repository turns into
    // `IS NULL`.
    { label: t("creditCard.filter.noBillingWallet"), value: FILTER_NONE },
    ...(wallets ?? []).map((wallet) => ({ label: wallet.name, value: wallet.id })),
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
        label={t("common.name")}
        value={filters.search}
        onValueChange={(search) => patch({ search })}
      />
      <FilterSelect
        label={t("common.currency")}
        items={currencyItems}
        value={filters.currencyCode}
        onValueChange={(value) =>
          patch({ currencyCode: value as CreditCardFiltersState["currencyCode"] })
        }
      />
      <FilterSelect
        label={t("creditCard.column.billingWallet")}
        items={walletItems}
        value={filters.defaultBillingWalletId}
        onValueChange={(value) => patch({ defaultBillingWalletId: value })}
      />
    </FilterBar>
  );
}
