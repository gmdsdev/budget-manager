import {
  cardAccountValue,
  defaultTransactionFilters,
  isTransactionFiltered,
  TRANSACTION_FILTER_ALL,
  type TransactionFiltersState,
  walletAccountValue,
} from "@budget-manager/client";
import {
  useCategoryOptionsQuery,
  useCreditCardOptionsQuery,
  useEnumLabels,
  useWalletOptionsQuery,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import {
  FILTER_NONE,
  TransactionKind,
  TransactionRepeats,
  TransactionStatus,
} from "@budget-manager/schemas";

import { FilterBar } from "@/components/filter-bar";
import { FilterSearch } from "@/components/filter-search";
import { type FilterItem, FilterSelect } from "@/components/filter-select";
import { DateRangePicker } from "@/components/ui/date-picker";
import { useColors } from "@/theme/theme-provider";

export function TransactionFilters({
  filters,
  onFiltersChange,
}: {
  filters: TransactionFiltersState;
  onFiltersChange: (filters: TransactionFiltersState) => void;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const colors = useColors();

  const { data: wallets } = useWalletOptionsQuery();
  const { data: cards } = useCreditCardOptionsQuery();
  const { data: categories } = useCategoryOptionsQuery();

  const kindItems: FilterItem[] = [
    { label: t("transaction.filter.allKinds"), value: TRANSACTION_FILTER_ALL },
    ...Object.values(TransactionKind).map((kind) => ({
      label: labels.transactionKind(kind),
      value: kind,
    })),
  ];

  const repeatsItems: FilterItem[] = [
    { label: t("transaction.filter.allRows"), value: TRANSACTION_FILTER_ALL },
    ...Object.values(TransactionRepeats).map((repeats) => ({
      label: labels.transactionRepeats(repeats),
      value: repeats,
    })),
  ];

  const statusItems: FilterItem[] = [
    { label: t("transaction.filter.allStatuses"), value: TRANSACTION_FILTER_ALL },
    ...Object.values(TransactionStatus).map((status) => ({
      label: labels.transactionStatus(status),
      value: status,
    })),
  ];

  // The Account filter spans both tables, because the Account line shows whichever
  // owns the row — so the value is prefixed and split back on the way out.
  const accountItems: FilterItem[] = [
    { label: t("transaction.filter.allAccounts"), value: TRANSACTION_FILTER_ALL },
    ...(wallets ?? []).map((wallet) => ({
      label: wallet.name,
      value: walletAccountValue(wallet.id),
    })),
    ...(cards ?? []).map((card) => ({
      label: card.name,
      value: cardAccountValue(card.id),
    })),
  ];

  // `FILTER_NONE` is the shared sentinel for an empty column, which the repository
  // turns into `IS NULL`; it is the same value the forms use for uncategorized.
  const categoryFilterItems: FilterItem[] = [
    { label: t("transaction.filter.allCategories"), value: TRANSACTION_FILTER_ALL },
    { label: t("category.uncategorized"), value: FILTER_NONE, color: null },
    ...(categories ?? []).map((category) => ({
      label: category.name,
      value: category.id,
      color: colors.category[category.color],
    })),
  ];

  function patch(next: Partial<TransactionFiltersState>) {
    onFiltersChange({ ...filters, ...next });
  }

  return (
    <FilterBar
      // Clearing resets to the current month rather than to nothing: there is no
      // all-time ledger.
      isFiltered={isTransactionFiltered(filters)}
      onClear={() => onFiltersChange(defaultTransactionFilters())}
    >
      <DateRangePicker
        label={t("transaction.filter.dateRange")}
        value={{ from: filters.dateFrom, to: filters.dateTo }}
        onValueChange={({ from, to }) => patch({ dateFrom: from, dateTo: to })}
        style={{ width: "100%" }}
      />

      <FilterSearch
        label={t("common.description")}
        value={filters.search}
        onValueChange={(search) => patch({ search })}
      />

      <FilterSelect
        label={t("common.account")}
        items={accountItems}
        value={filters.accountId}
        onValueChange={(accountId) => patch({ accountId })}
      />

      <FilterSelect
        label={t("common.category")}
        items={categoryFilterItems}
        value={filters.categoryId}
        onValueChange={(categoryId) => patch({ categoryId })}
      />

      <FilterSelect
        label={t("transaction.filter.kind")}
        items={kindItems}
        value={filters.kind}
        onValueChange={(value) =>
          patch({ kind: value as TransactionFiltersState["kind"] })
        }
      />

      <FilterSelect
        label={t("transaction.column.repeats")}
        items={repeatsItems}
        value={filters.repeats}
        onValueChange={(value) =>
          patch({ repeats: value as TransactionFiltersState["repeats"] })
        }
      />

      <FilterSelect
        label={t("common.status")}
        items={statusItems}
        value={filters.status}
        onValueChange={(value) =>
          patch({ status: value as TransactionFiltersState["status"] })
        }
      />
    </FilterBar>
  );
}
