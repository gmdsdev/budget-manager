import {
  CREDITED_TRANSACTION_KINDS,
  RecurrenceType,
  RecurrenceTypeLabelMap,
  TransactionKindLabelMap,
  TransactionRepeats,
  TransactionRepeatsLabelMap,
  TransactionStatusLabelMap,
} from "@budget-manager/schemas";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { ColumnDef } from "@tanstack/react-table";
import { CategoryLabel } from "@/modules/category/components/category-dot";
import type { TransactionRow } from "../../types";
import { formatDateString } from "../../utils/date";
import { TransactionRowActions } from "./transaction-row-actions";

export const transactionColumns: ColumnDef<TransactionRow>[] = [
  {
    accessorKey: "occurrenceDate",
    header: "Date",
    cell: ({ row }) => (
      <span className="whitespace-nowrap tabular-nums">
        {formatDateString(row.original.occurrenceDate)}
      </span>
    ),
  },
  {
    accessorKey: "name",
    header: "Description",
    meta: { mobile: "primary", grow: true },
  },
  {
    accessorKey: "walletName",
    header: "Account",
    // A card purchase has no wallet; the card is the account it belongs to.
    cell: ({ row }) =>
      row.original.walletName ?? row.original.creditCardName ?? "—",
  },
  {
    accessorKey: "categoryName",
    header: "Category",
    cell: ({ row }) => (
      <CategoryLabel
        color={row.original.categoryColor}
        name={row.original.categoryName ?? "Uncategorized"}
      />
    ),
  },
  {
    accessorKey: "kind",
    header: "Kind",
    cell: ({ row }) => TransactionKindLabelMap[row.original.kind],
  },
  {
    id: "repeats",
    header: "Repeats",
    cell: ({ row }) => {
      const { recurrenceType, recurrenceInterval, recurrenceInstallments } =
        row.original;

      if (!recurrenceType) {
        return (
          <span className="text-xs text-muted-foreground">
            {TransactionRepeatsLabelMap[TransactionRepeats.ONE_OFF]}
          </span>
        );
      }

      const type = recurrenceType as RecurrenceType;
      const label =
        type === RecurrenceType.FIXED
          ? `${recurrenceInstallments ?? 0}× monthly`
          : recurrenceInterval && recurrenceInterval > 1
            ? `${RecurrenceTypeLabelMap[type]} ×${recurrenceInterval}`
            : RecurrenceTypeLabelMap[type];

      return <span className="whitespace-nowrap text-xs">{label}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => TransactionStatusLabelMap[row.original.status],
  },
  {
    accessorKey: "amountCents",
    header: () => <span className="block text-right">Amount</span>,
    meta: { label: "Amount", mobile: "trailing" },
    cell: ({ row }) => {
      const isCredit = CREDITED_TRANSACTION_KINDS.includes(row.original.kind);
      const amount = formatMinorUnits(
        row.original.amountCents,
        row.original.walletCurrencyCode ?? "BRL",
      );

      return (
        <span
          className={`block text-right tabular-nums ${
            isCredit ? "text-emerald-600 dark:text-emerald-400" : ""
          }`}
        >
          {isCredit ? "+" : "−"}
          {amount}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    meta: { label: "Actions", mobile: "actions" },
    cell: ({ row }) => <TransactionRowActions transaction={row.original} />,
  },
];
