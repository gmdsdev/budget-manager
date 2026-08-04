import { FilterBar } from "@/components/filter-bar";
import { FilterSearch } from "@/components/filter-search";
import { FilterSelect, type FilterItem } from "@/components/filter-select";
import { categoryColorVar } from "@/modules/category/colors";
import { useCategoryOptionsQuery } from "@budget-manager/client/react";
import { useCreditCardOptionsQuery } from "@budget-manager/client/react";
import { useWalletOptionsQuery } from "@budget-manager/client/react";
import { useEnumLabels } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import {
  FILTER_NONE,
  TransactionKind,
  TransactionRepeats,
  TransactionStatus,
} from "@budget-manager/schemas";
import { Button } from "@budget-manager/ui/components/button";
import { DateRangePicker } from "@budget-manager/ui/components/date-picker";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import {
  cardAccountValue,
  defaultTransactionFilters,
  isTransactionFiltered,
  shiftDateRange,
  TRANSACTION_FILTER_ALL,
  walletAccountValue,
  type TransactionFiltersState,
} from "@budget-manager/client";

export function TransactionFilters({
  filters,
  onFiltersChange,
}: {
  filters: TransactionFiltersState;
  onFiltersChange: (filters: TransactionFiltersState) => void;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();

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
    {
      label: t("transaction.filter.allStatuses"),
      value: TRANSACTION_FILTER_ALL,
    },
    ...Object.values(TransactionStatus).map((status) => ({
      label: labels.transactionStatus(status),
      value: status,
    })),
  ];

  const { data: wallets } = useWalletOptionsQuery();
  const { data: cards } = useCreditCardOptionsQuery();
  const { data: categories } = useCategoryOptionsQuery();

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

  const categoryItems: FilterItem[] = [
    {
      label: t("transaction.filter.allCategories"),
      value: TRANSACTION_FILTER_ALL,
    },
    { label: t("category.uncategorized"), value: FILTER_NONE, color: null },
    ...(categories ?? []).map((category) => ({
      label: category.name,
      value: category.id,
      color: categoryColorVar(category.color),
    })),
  ];

  function patch(next: Partial<TransactionFiltersState>) {
    onFiltersChange({ ...filters, ...next });
  }

  function step(direction: 1 | -1) {
    const { from, to } = shiftDateRange(
      { from: filters.dateFrom, to: filters.dateTo },
      direction,
    );

    patch({ dateFrom: from, dateTo: to });
  }

  return (
    <FilterBar
      isFiltered={isTransactionFiltered(filters)}
      onClear={() => onFiltersChange(defaultTransactionFilters())}
    >
      {/* The arrows flank the range because they move it: one click is the same
          period again, forward or back — a month for a month, a week for a week,
          and its own length in days for anything drawn by hand. Neither is
          disabled, since the ledger reaches into the future a series has
          already been written into. */}
      <div className="col-span-2 flex flex-row items-center gap-1 sm:col-span-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("common.previousPeriod")}
          onClick={() => step(-1)}
        >
          <CaretLeftIcon aria-hidden />
        </Button>

        <DateRangePicker
          id="transaction-date-range-filter"
          aria-label={t("transaction.filter.dateRange")}
          size="sm"
          // Sized to its content above sm, not pinned: a formatted range is far
          // longer in some languages than in English ("1 de jul. – 31 de jul. de
          // 2026"), and a fixed width clipped it.
          className="flex-1 rounded-full sm:w-auto sm:min-w-44 sm:flex-none"
          value={{ from: filters.dateFrom, to: filters.dateTo }}
          onValueChange={({ from, to }) =>
            patch({ dateFrom: from, dateTo: to })
          }
        />

        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("common.nextPeriod")}
          onClick={() => step(1)}
        >
          <CaretRightIcon aria-hidden />
        </Button>
      </div>

      <FilterSearch
        id="transaction-description-filter"
        label={t("common.description")}
        value={filters.search}
        onValueChange={(search) => patch({ search })}
      />

      <FilterSelect
        id="transaction-account-filter"
        label={t("common.account")}
        items={accountItems}
        value={filters.accountId}
        onValueChange={(accountId) => patch({ accountId })}
      />

      <FilterSelect
        id="transaction-category-filter"
        label={t("common.category")}
        items={categoryItems}
        value={filters.categoryId}
        onValueChange={(categoryId) => patch({ categoryId })}
      />

      <FilterSelect
        id="transaction-kind-filter"
        label={t("transaction.filter.kind")}
        items={kindItems}
        value={filters.kind}
        onValueChange={(value) =>
          patch({ kind: value as TransactionFiltersState["kind"] })
        }
      />

      <FilterSelect
        id="transaction-repeats-filter"
        label={t("transaction.column.repeats")}
        items={repeatsItems}
        value={filters.repeats}
        onValueChange={(value) =>
          patch({ repeats: value as TransactionFiltersState["repeats"] })
        }
      />

      <FilterSelect
        id="transaction-status-filter"
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
