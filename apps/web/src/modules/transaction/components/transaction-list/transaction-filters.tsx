import { FilterBar } from "@/components/filter-bar";
import { FilterSearch } from "@/components/filter-search";
import { FilterSelect, type FilterItem } from "@/components/filter-select";
import { categoryColorVar } from "@/modules/category/colors";
import { useCategoryOptionsQuery } from "@/modules/category/queries/use-category-options-query";
import { useCreditCardOptionsQuery } from "@/modules/credit-card/queries/use-credit-card-options-query";
import { useWalletOptionsQuery } from "@/modules/wallet/queries/use-wallet-options-query";
import {
  FILTER_NONE,
  TransactionKind,
  TransactionKindLabelMap,
  TransactionRepeats,
  TransactionRepeatsLabelMap,
  TransactionStatus,
  TransactionStatusLabelMap,
} from "@budget-manager/schemas";
import { DateRangePicker } from "@budget-manager/ui/components/date-picker";
import {
  cardAccountValue,
  defaultTransactionFilters,
  isTransactionFiltered,
  TRANSACTION_FILTER_ALL,
  walletAccountValue,
  type TransactionFiltersState,
} from "../../types";

const KIND_ITEMS: FilterItem[] = [
  { label: "All kinds", value: TRANSACTION_FILTER_ALL },
  ...Object.values(TransactionKind).map((kind) => ({
    label: TransactionKindLabelMap[kind],
    value: kind,
  })),
];

const REPEATS_ITEMS: FilterItem[] = [
  { label: "All rows", value: TRANSACTION_FILTER_ALL },
  ...Object.values(TransactionRepeats).map((repeats) => ({
    label: TransactionRepeatsLabelMap[repeats],
    value: repeats,
  })),
];

const STATUS_ITEMS: FilterItem[] = [
  { label: "All statuses", value: TRANSACTION_FILTER_ALL },
  ...Object.values(TransactionStatus).map((status) => ({
    label: TransactionStatusLabelMap[status],
    value: status,
  })),
];

export function TransactionFilters({
  filters,
  onFiltersChange,
}: {
  filters: TransactionFiltersState;
  onFiltersChange: (filters: TransactionFiltersState) => void;
}) {
  const { data: wallets } = useWalletOptionsQuery();
  const { data: cards } = useCreditCardOptionsQuery();
  const { data: categories } = useCategoryOptionsQuery();

  const accountItems: FilterItem[] = [
    { label: "All accounts", value: TRANSACTION_FILTER_ALL },
    ...(wallets ?? []).map((wallet) => ({
      label: wallet.name,
      value: walletAccountValue(wallet.id),
    })),
    ...(cards ?? []).map((card) => ({
      label: card.name,
      value: cardAccountValue(card.id),
    })),
  ];

  const categoryItems: FilterItem[] = [
    { label: "All categories", value: TRANSACTION_FILTER_ALL },
    { label: "Uncategorized", value: FILTER_NONE, color: null },
    ...(categories ?? []).map((category) => ({
      label: category.name,
      value: category.id,
      color: categoryColorVar(category.color),
    })),
  ];

  function patch(next: Partial<TransactionFiltersState>) {
    onFiltersChange({ ...filters, ...next });
  }

  return (
    <FilterBar
      isFiltered={isTransactionFiltered(filters)}
      onClear={() => onFiltersChange(defaultTransactionFilters())}
    >
      <DateRangePicker
        id="transaction-date-range-filter"
        aria-label="Date range"
        className="col-span-2 w-full sm:col-span-1 sm:w-56"
        value={{ from: filters.dateFrom, to: filters.dateTo }}
        onValueChange={({ from, to }) =>
          patch({ dateFrom: from, dateTo: to })
        }
      />

      <FilterSearch
        id="transaction-description-filter"
        label="Description"
        value={filters.search}
        onValueChange={(search) => patch({ search })}
      />

      <FilterSelect
        id="transaction-account-filter"
        label="Account"
        items={accountItems}
        value={filters.accountId}
        onValueChange={(accountId) => patch({ accountId })}
      />

      <FilterSelect
        id="transaction-category-filter"
        label="Category"
        items={categoryItems}
        value={filters.categoryId}
        onValueChange={(categoryId) => patch({ categoryId })}
      />

      <FilterSelect
        id="transaction-kind-filter"
        label="Kind"
        items={KIND_ITEMS}
        value={filters.kind}
        onValueChange={(value) =>
          patch({ kind: value as TransactionFiltersState["kind"] })
        }
      />

      <FilterSelect
        id="transaction-repeats-filter"
        label="Repeats"
        items={REPEATS_ITEMS}
        value={filters.repeats}
        onValueChange={(value) =>
          patch({ repeats: value as TransactionFiltersState["repeats"] })
        }
      />

      <FilterSelect
        id="transaction-status-filter"
        label="Status"
        items={STATUS_ITEMS}
        value={filters.status}
        onValueChange={(value) =>
          patch({ status: value as TransactionFiltersState["status"] })
        }
      />
    </FilterBar>
  );
}
