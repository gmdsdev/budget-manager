import { CategoryTypeLabelMap } from "@budget-manager/schemas";
import type { ColumnDef } from "@tanstack/react-table";
import type { CategoryRow } from "../../types";
import { CategoryRowActions } from "./category-row-actions";

export const categoryColumns: ColumnDef<CategoryRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => CategoryTypeLabelMap[row.original.type],
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <CategoryRowActions category={row.original} />,
  },
];
