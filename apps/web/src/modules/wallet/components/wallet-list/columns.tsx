import {
  WalletCurrencyLabelMap,
  WalletTypeLabelMap,
  type WalletCurrency,
} from "@budget-manager/schemas";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { ColumnDef } from "@tanstack/react-table";
import type { WalletRow } from "../../types";
import { WalletRowActions } from "./wallet-row-actions";

export const walletColumns: ColumnDef<WalletRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    meta: { mobile: "primary" },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => WalletTypeLabelMap[row.original.type],
  },
  {
    accessorKey: "currencyCode",
    header: "Currency",
    cell: ({ row }) => {
      const code = row.original.currencyCode;

      return WalletCurrencyLabelMap[code as WalletCurrency] ?? code;
    },
  },
  {
    accessorKey: "openingBalanceCents",
    header: () => <span className="block text-right">Opening Balance</span>,
    meta: { label: "Opening Balance" },
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        {formatMinorUnits(
          row.original.openingBalanceCents,
          row.original.currencyCode,
        )}
      </span>
    ),
  },
  {
    accessorKey: "balanceCents",
    header: () => <span className="block text-right">Balance</span>,
    meta: { label: "Balance", mobile: "trailing" },
    cell: ({ row }) => {
      const { balanceCents, projectedBalanceCents, currencyCode } = row.original;
      const hasPending = projectedBalanceCents !== balanceCents;

      return (
        <span className="block text-right tabular-nums">
          <span className={balanceCents < 0 ? "text-destructive" : undefined}>
            {formatMinorUnits(balanceCents, currencyCode)}
          </span>
          {hasPending && (
            <span className="block text-xs text-muted-foreground">
              {formatMinorUnits(projectedBalanceCents, currencyCode)} projected
            </span>
          )}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    meta: { label: "Actions", mobile: "actions" },
    cell: ({ row }) => <WalletRowActions wallet={row.original} />,
  },
];
