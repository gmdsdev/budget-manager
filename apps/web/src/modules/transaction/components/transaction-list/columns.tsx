import { type EnumLabels, useEnumLabels } from "@budget-manager/client/react";
import { CategoryLabel } from "@/modules/category/components/category-dot";
import type { Translate } from "@budget-manager/i18n";
import { useTranslate } from "@budget-manager/i18n/react";
import { CREDITED_TRANSACTION_KINDS } from "@budget-manager/schemas";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import {
  transactionRepeatsLabel,
  type TransactionRow,
} from "@budget-manager/client";
import { TransactionRowActions } from "./transaction-row-actions";

export function useTransactionColumns(): ColumnDef<TransactionRow>[] {
  const t = useTranslate();
  const labels = useEnumLabels();

  return useMemo(() => transactionColumns(t, labels), [t, labels]);
}

function transactionColumns(
  t: Translate,
  labels: EnumLabels,
): ColumnDef<TransactionRow>[] {
  return [
    {
      accessorKey: "name",
      header: t("common.description"),
      meta: { mobile: "primary", grow: true },
    },
    {
      accessorKey: "walletName",
      header: t("common.account"),
      // A card purchase has no wallet; the card is the account it belongs to.
      cell: ({ row }) =>
        row.original.walletName ??
        row.original.creditCardName ??
        t("common.none"),
    },
    {
      accessorKey: "categoryName",
      header: t("common.category"),
      cell: ({ row }) => (
        <CategoryLabel
          color={row.original.categoryColor}
          name={row.original.categoryName ?? t("category.uncategorized")}
        />
      ),
    },
    {
      accessorKey: "kind",
      header: t("transaction.filter.kind"),
      cell: ({ row }) => labels.transactionKind(row.original.kind),
    },
    {
      id: "repeats",
      header: t("transaction.column.repeats"),
      // The label is a display rule the native app reads too, so it lives in
      // `@budget-manager/client`; only the muted styling of a one-off is web's.
      cell: ({ row }) => (
        <span
          className={
            row.original.recurrenceType
              ? "whitespace-nowrap text-xs"
              : "text-xs text-muted-foreground"
          }
        >
          {transactionRepeatsLabel(t, labels, row.original)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t("common.status"),
      cell: ({ row }) => labels.transactionStatus(row.original.status),
    },
    {
      accessorKey: "amountCents",
      header: () => (
        <span className="block text-right">{t("common.amount")}</span>
      ),
      meta: { label: t("common.amount"), mobile: "trailing" },
      cell: ({ row }) => {
        const isCredit = CREDITED_TRANSACTION_KINDS.includes(row.original.kind);
        const amount = formatMinorUnits(
          row.original.amountCents,
          row.original.walletCurrencyCode ?? "BRL",
        );

        return (
          <span
            className={`block text-right tabular-nums ${
              isCredit ? "text-success" : ""
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
      header: () => <span className="sr-only">{t("common.actions")}</span>,
      meta: { label: t("common.actions"), mobile: "actions" },
      cell: ({ row }) => <TransactionRowActions transaction={row.original} />,
    },
  ];
}
