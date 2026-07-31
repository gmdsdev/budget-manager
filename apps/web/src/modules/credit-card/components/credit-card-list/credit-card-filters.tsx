import { FilterBar } from "@/components/filter-bar";
import { FilterSearch } from "@/components/filter-search";
import { FilterSelect, type FilterItem } from "@/components/filter-select";
import { useWalletOptionsQuery } from "@/modules/wallet/queries/use-wallet-options-query";
import { useEnumLabels } from "@/lib/enum-labels";
import { useTranslate } from "@budget-manager/i18n/react";
import { FILTER_NONE, WalletCurrency } from "@budget-manager/schemas";
import {
  CREDIT_CARD_FILTER_ALL,
  EMPTY_CREDIT_CARD_FILTERS,
  isCreditCardFiltered,
  type CreditCardFiltersState,
} from "../../types";

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
    {
      label: t("creditCard.filter.allCurrencies"),
      value: CREDIT_CARD_FILTER_ALL,
    },
    ...Object.values(WalletCurrency).map((currency) => ({
      label: labels.currency(currency),
      value: currency,
    })),
  ];

  const walletItems: FilterItem[] = [
    { label: t("creditCard.filter.allWallets"), value: CREDIT_CARD_FILTER_ALL },
    { label: t("creditCard.filter.noBillingWallet"), value: FILTER_NONE },
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
        label={t("common.name")}
        value={filters.search}
        onValueChange={(search) => patch({ search })}
      />

      <FilterSelect
        id="credit-card-currency-filter"
        label={t("common.currency")}
        items={currencyItems}
        value={filters.currencyCode}
        onValueChange={(value) =>
          patch({
            currencyCode: value as CreditCardFiltersState["currencyCode"],
          })
        }
      />

      <FilterSelect
        id="credit-card-billing-wallet-filter"
        label={t("creditCard.column.billingWallet")}
        items={walletItems}
        value={filters.defaultBillingWalletId}
        onValueChange={(value) => patch({ defaultBillingWalletId: value })}
      />
    </FilterBar>
  );
}
