import { CategoryTypeLabelMap } from "@budget-manager/schemas";
import type { ColumnDef } from "@tanstack/react-table";
import type { CategoryRow } from "../../types";
import { CategoryLabel } from "../category-dot";
import { CategoryRowActions } from "./category-row-actions";

export const categoryColumns: ColumnDef<CategoryRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    meta: { mobile: "primary", grow: true },
    // The swatch rides in the name cell rather than owning a column: it is how
    // a category reads everywhere else, and a column of its own would owe the
    // listing a filter for a value nobody searches by.
    cell: ({ row }) => (
      <CategoryLabel color={row.original.color} name={row.original.name} />
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => CategoryTypeLabelMap[row.original.type],
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    meta: { label: "Actions", mobile: "actions" },
    cell: ({ row }) => <CategoryRowActions category={row.original} />,
  },
];
