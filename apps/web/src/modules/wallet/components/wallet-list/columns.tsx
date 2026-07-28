"use client";

import { ColumnDef } from "@tanstack/react-table";
import { WalletDto } from "@budget-manager/schemas";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@budget-manager/ui/components/dropdown-menu";
import { Button } from "@budget-manager/ui/components/button";
import { MoreHorizontalIcon } from "lucide-react";

export const columns: ColumnDef<WalletDto>[] = [
  {
    accessorKey: "name",
    header: "Name",
    size: 10000,
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
    size: 100,
  },
  {
    accessorKey: "balance",
    header: "Balance",
    size: 100,
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
  {
    id: "actions",
    header: "",
    size: 0,
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontalIcon />
                <span className="sr-only">Open menu</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
