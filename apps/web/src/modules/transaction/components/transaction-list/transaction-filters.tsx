import { useCategoryOptionsQuery } from "@/modules/category/queries/use-category-options-query";
import { useWalletOptionsQuery } from "@/modules/wallet/queries/use-wallet-options-query";
import {
  TransactionKind,
  TransactionKindLabelMap,
  TransactionStatus,
  TransactionStatusLabelMap,
} from "@budget-manager/schemas";
import { Button } from "@budget-manager/ui/components/button";
import { Field, FieldLabel } from "@budget-manager/ui/components/field";
import { Input } from "@budget-manager/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@budget-manager/ui/components/select";
import {
  EMPTY_TRANSACTION_FILTERS,
  TRANSACTION_FILTER_ALL,
  isTransactionFiltered,
  type TransactionFiltersState,
} from "../../types";

type FilterItem = { label: string; value: string };

const KIND_ITEMS: FilterItem[] = [
  { label: "All kinds", value: TRANSACTION_FILTER_ALL },
  ...Object.values(TransactionKind).map((kind) => ({
    label: TransactionKindLabelMap[kind],
    value: kind,
  })),
];

const STATUS_ITEMS: FilterItem[] = [
  { label: "All statuses", value: TRANSACTION_FILTER_ALL },
  ...Object.values(TransactionStatus).map((status) => ({
    label: TransactionStatusLabelMap[status],
    value: status,
  })),
];

function FilterSelect({
  id,
  label,
  items,
  value,
  onValueChange,
}: {
  id: string;
  label: string;
  items: FilterItem[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Field orientation="horizontal" className="w-auto">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select<string>
        items={items}
        id={id}
        value={value}
        onValueChange={(next) => onValueChange(next as string)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function TransactionFilters({
  filters,
  onFiltersChange,
}: {
  filters: TransactionFiltersState;
  onFiltersChange: (filters: TransactionFiltersState) => void;
}) {
  const { data: wallets } = useWalletOptionsQuery();
  const { data: categories } = useCategoryOptionsQuery();

  const walletItems: FilterItem[] = [
    { label: "All wallets", value: TRANSACTION_FILTER_ALL },
    ...(wallets ?? []).map((wallet) => ({
      label: wallet.name,
      value: wallet.id,
    })),
  ];

  const categoryItems: FilterItem[] = [
    { label: "All categories", value: TRANSACTION_FILTER_ALL },
    ...(categories ?? []).map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ];

  function patch(next: Partial<TransactionFiltersState>) {
    onFiltersChange({ ...filters, ...next });
  }

  const isFiltered = isTransactionFiltered(filters);

  return (
    <div className="flex flex-row flex-wrap items-end gap-4 pb-4">
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
        id="transaction-status-filter"
        label="Status"
        items={STATUS_ITEMS}
        value={filters.status}
        onValueChange={(value) =>
          patch({ status: value as TransactionFiltersState["status"] })
        }
      />

      <FilterSelect
        id="transaction-wallet-filter"
        label="Wallet"
        items={walletItems}
        value={filters.walletId}
        onValueChange={(value) => patch({ walletId: value })}
      />

      <FilterSelect
        id="transaction-category-filter"
        label="Category"
        items={categoryItems}
        value={filters.categoryId}
        onValueChange={(value) => patch({ categoryId: value })}
      />

      <Field orientation="horizontal" className="w-auto">
        <FieldLabel htmlFor="transaction-date-from">From</FieldLabel>
        <Input
          id="transaction-date-from"
          type="date"
          className="w-auto"
          value={filters.dateFrom}
          onChange={(event) => patch({ dateFrom: event.target.value })}
        />
      </Field>

      <Field orientation="horizontal" className="w-auto">
        <FieldLabel htmlFor="transaction-date-to">To</FieldLabel>
        <Input
          id="transaction-date-to"
          type="date"
          className="w-auto"
          value={filters.dateTo}
          onChange={(event) => patch({ dateTo: event.target.value })}
        />
      </Field>

      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => onFiltersChange(EMPTY_TRANSACTION_FILTERS)}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
