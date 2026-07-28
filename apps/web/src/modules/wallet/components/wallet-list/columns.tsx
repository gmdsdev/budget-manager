"use client";

import { ColumnDef } from "@tanstack/react-table";
import { WalletDto } from "@budget-manager/schemas";

export const columns: ColumnDef<WalletDto>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      return (
        <div>
          {row.original.type.charAt(0).toUpperCase() +
            row.original.type.slice(1)}
        </div>
      );
    },
  },
  {
    accessorKey: "currency",
    header: "Currency",
  },
  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => {
      const balance = parseFloat(row.getValue("balance"));
      const currency = String(row.getValue("currency"));

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(balance);

      return <div>{formatted}</div>;
    },
  },
];
