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
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <WalletRowActions wallet={row.original} />,
  },
];
