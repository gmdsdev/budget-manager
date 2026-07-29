"use client";

import { ColumnDef } from "@tanstack/react-table";
import { WalletCurrencyLabelMap, WalletDto } from "@budget-manager/schemas";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@budget-manager/ui/components/dropdown-menu";
import { Button } from "@budget-manager/ui/components/button";
import { MoreHorizontalIcon } from "lucide-react";
import { DeleteWalletDialog } from "../delete-wallet-dialog";
import { useState } from "react";
import { EditWalletDialog } from "../edit-wallet-dialog";
import { formatFromCents } from "@budget-manager/ui/lib/currency";

export const columns: ColumnDef<WalletDto>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
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
    accessorKey: "currencyCode",
    header: "Currency",
    size: 100,
    cell: ({ row }) => {
      return <div>{WalletCurrencyLabelMap[row.original.currencyCode]}</div>;
    },
  },
  {
    accessorKey: "openingBalanceCents",
    header: "Opening Balance",
    size: 100,
    cell: ({ row }) => {
      const openingBalanceCents = parseFloat(
        row.getValue("openingBalanceCents"),
      );
      const currencyCode = row.original.currencyCode;

      const formatted = formatFromCents(openingBalanceCents, currencyCode);

      return <div className="text-right">{formatted}</div>;
    },
  },
  {
    id: "actions",
    header: "",
    size: 0,
    cell: ({ row }) => {
      const [openEditDialog, setOpenEditDialog] = useState(false);
      const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
      const walletId = row.original.id;

      return (
        <>
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
              <DropdownMenuItem
                onClick={() => {
                  setOpenEditDialog(true);
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="text-destructive"
                onClick={() => {
                  setOpenDeleteDialog(true);
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <EditWalletDialog
            wallet={row.original}
            open={openEditDialog}
            setOpen={setOpenEditDialog}
          />

          <DeleteWalletDialog
            walletId={walletId}
            open={openDeleteDialog}
            setOpen={setOpenDeleteDialog}
          />
        </>
      );
    },
  },
];
