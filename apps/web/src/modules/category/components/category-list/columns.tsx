import { type EnumLabels, useEnumLabels } from "@/lib/enum-labels";
import type { Translate } from "@budget-manager/i18n";
import { useTranslate } from "@budget-manager/i18n/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import type { CategoryRow } from "../../types";
import { CategoryLabel } from "../category-dot";
import { CategoryRowActions } from "./category-row-actions";

export function useCategoryColumns(): ColumnDef<CategoryRow>[] {
  const t = useTranslate();
  const labels = useEnumLabels();

  return useMemo(() => categoryColumns(t, labels), [t, labels]);
}

function categoryColumns(
  t: Translate,
  labels: EnumLabels,
): ColumnDef<CategoryRow>[] {
  return [
    {
      accessorKey: "name",
      header: t("common.name"),
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
      header: t("common.type"),
      cell: ({ row }) => labels.categoryType(row.original.type),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("common.actions")}</span>,
      meta: { label: t("common.actions"), mobile: "actions" },
      cell: ({ row }) => <CategoryRowActions category={row.original} />,
    },
  ];
}
