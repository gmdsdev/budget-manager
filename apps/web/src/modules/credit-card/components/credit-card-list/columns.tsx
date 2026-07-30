import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { ColumnDef } from "@tanstack/react-table";
import type { CreditCardRow } from "../../types";
import { CreditCardRowActions } from "./credit-card-row-actions";

export const creditCardColumns: ColumnDef<CreditCardRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "currencyCode",
    header: "Currency",
  },
  {
    id: "cycle",
    header: "Cycle",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        Closes {row.original.closeDay} · Due {row.original.dueDay}
      </span>
    ),
  },
  {
    accessorKey: "defaultBillingWalletName",
    header: "Billing wallet",
    cell: ({ row }) => row.original.defaultBillingWalletName ?? "—",
  },
  {
    accessorKey: "limitCents",
    header: () => <span className="block text-right">Limit</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        {formatMinorUnits(row.original.limitCents, row.original.currencyCode)}
      </span>
    ),
  },
  {
    accessorKey: "outstandingCents",
    header: () => <span className="block text-right">Outstanding</span>,
    cell: ({ row }) => {
      const { outstandingCents, projectedOutstandingCents, currencyCode } =
        row.original;
      const hasPending = projectedOutstandingCents !== outstandingCents;

      return (
        <span className="block text-right tabular-nums">
          <span className={outstandingCents > 0 ? "text-destructive" : undefined}>
            {formatMinorUnits(outstandingCents, currencyCode)}
          </span>
          {hasPending && (
            <span className="block text-xs text-muted-foreground">
              {formatMinorUnits(projectedOutstandingCents, currencyCode)}{" "}
              projected
            </span>
          )}
        </span>
      );
    },
  },
  {
    accessorKey: "availableCents",
    header: () => <span className="block text-right">Available</span>,
    cell: ({ row }) => (
      <span
        className={`block text-right tabular-nums ${
          row.original.availableCents < 0 ? "text-destructive" : ""
        }`}
      >
        {formatMinorUnits(
          row.original.availableCents,
          row.original.currencyCode,
        )}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <CreditCardRowActions card={row.original} />,
  },
];
