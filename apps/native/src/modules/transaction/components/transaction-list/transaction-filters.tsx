import {
  cardAccountValue,
  defaultTransactionFilters,
  shiftDateRange,
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
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { View } from "react-native";

import { FilterSearch } from "@/components/filter-search";
import { type FilterItem, FilterSelect } from "@/components/filter-select";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-picker";
import { Sheet } from "@/components/ui/sheet";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

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
  const [open, setOpen] = useState(false);

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

  function step(direction: 1 | -1) {
    const { from, to } = shiftDateRange(
      { from: filters.dateFrom, to: filters.dateTo },
      direction,
    );

    patch({ dateFrom: from, dateTo: to });
  }

  // Everything except the range. The date is the ledger's scope and is always set, so
  // it is the one control worth a permanent row; these are the narrowing ones, and how
  // many are on is what the trigger reports.
  const applied = [
    filters.search ? 1 : 0,
    filters.accountId === TRANSACTION_FILTER_ALL ? 0 : 1,
    filters.categoryId === TRANSACTION_FILTER_ALL ? 0 : 1,
    filters.kind === TRANSACTION_FILTER_ALL ? 0 : 1,
    filters.repeats === TRANSACTION_FILTER_ALL ? 0 : 1,
    filters.status === TRANSACTION_FILTER_ALL ? 0 : 1,
  ].reduce((total, one) => total + one, 0);

  return (
    <>
      {/* One row, not five. Seven controls stacked two-up filled most of a phone
          before the first transaction — a bar that big is not scoping the list, it
          *is* the screen. The range stays out because the ledger is never unscoped
          and the dates are worth reading at a glance; the rest open on demand. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.sm,
          paddingTop: SPACING.md,
        }}
      >
        {/* The arrows flank the range because they move it: one tap is the same
            period again, forward or back — a month for a month, a week for a week,
            and its own length in days for anything drawn by hand. `xs` gaps inside
            the group and `sm` outside it are what make the three read as one
            control rather than three peers beside the filters button. */}
        <View
          style={{
            flex: 1,
            minWidth: 0,
            flexDirection: "row",
            alignItems: "center",
            gap: SPACING.xs,
          }}
        >
          <Button
            variant="outline"
            size="icon-sm"
            accessibilityLabel={t("common.previousPeriod")}
            leading={
              <Feather name="chevron-left" size={18} color={colors.foreground} />
            }
            onPress={() => step(-1)}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <DateRangePicker
              label={t("transaction.filter.dateRange")}
              size="sm"
              value={{ from: filters.dateFrom, to: filters.dateTo }}
              onValueChange={({ from, to }) => patch({ dateFrom: from, dateTo: to })}
            />
          </View>
          <Button
            variant="outline"
            size="icon-sm"
            accessibilityLabel={t("common.nextPeriod")}
            leading={
              <Feather
                name="chevron-right"
                size={18}
                color={colors.foreground}
              />
            }
            onPress={() => step(1)}
          />
        </View>
        <Button
          size="sm"
          variant={applied > 0 ? "secondary" : "outline"}
          label={
            applied > 0
              ? t("common.filtersApplied", { count: applied })
              : t("common.filters")
          }
          onPress={() => setOpen(true)}
        />
      </View>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("common.filters")}
        footer={
          <>
            <Button
              variant="outline"
              label={t("common.clearFilters")}
              // Clearing resets to the current month rather than to nothing: there is
              // no all-time ledger.
              onPress={() => onFiltersChange(defaultTransactionFilters())}
              style={{ flex: 1 }}
            />
            <Button
              label={t("common.close")}
              onPress={() => setOpen(false)}
              style={{ flex: 1 }}
            />
          </>
        }
      >
        <FilterSearch
          label={t("common.description")}
          value={filters.search}
          onValueChange={(search) => patch({ search })}
        />

        <FilterSelect
          full
          label={t("common.account")}
          items={accountItems}
          value={filters.accountId}
          onValueChange={(accountId) => patch({ accountId })}
        />

        <FilterSelect
          full
          label={t("common.category")}
          items={categoryFilterItems}
          value={filters.categoryId}
          onValueChange={(categoryId) => patch({ categoryId })}
        />

        <FilterSelect
          full
          label={t("transaction.filter.kind")}
          items={kindItems}
          value={filters.kind}
          onValueChange={(value) =>
            patch({ kind: value as TransactionFiltersState["kind"] })
          }
        />

        <FilterSelect
          full
          label={t("transaction.column.repeats")}
          items={repeatsItems}
          value={filters.repeats}
          onValueChange={(value) =>
            patch({ repeats: value as TransactionFiltersState["repeats"] })
          }
        />

        <FilterSelect
          full
          label={t("common.status")}
          items={statusItems}
          value={filters.status}
          onValueChange={(value) =>
            patch({ status: value as TransactionFiltersState["status"] })
          }
        />
      </Sheet>
    </>
  );
}
