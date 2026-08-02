import { CategoryLabel } from "@/modules/category/components/category-dot";
import type { I18nValue } from "@budget-manager/i18n/react";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import type { BudgetRow } from "@budget-manager/client";
import { repeatsLabel } from "@budget-manager/client";
import { BudgetRowActions } from "./budget-row-actions";

export function useBudgetColumns(): ColumnDef<BudgetRow>[] {
  const i18n = useI18n();

  return useMemo(() => budgetColumns(i18n), [i18n]);
}

function budgetColumns({
  t,
  formatMonthString,
}: I18nValue): ColumnDef<BudgetRow>[] {
  return [
    {
      accessorKey: "categoryName",
      header: t("common.category"),
      meta: { mobile: "primary", grow: true },
      cell: ({ row }) => (
        <CategoryLabel
          color={row.original.categoryColor}
          name={row.original.categoryName}
        />
      ),
    },
    {
      accessorKey: "amountCents",
      header: t("budget.column.limit"),
      meta: { mobile: "trailing" },
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatMinorUnits(row.original.amountCents, row.original.currencyCode)}
        </span>
      ),
    },
    {
      accessorKey: "currencyCode",
      header: t("common.currency"),
      cell: ({ row }) => row.original.currencyCode,
    },
    {
      accessorKey: "recurrenceType",
      header: t("budget.column.repeats"),
      cell: ({ row }) => repeatsLabel(t, row.original),
    },
    {
      accessorKey: "startsOn",
      header: t("budget.column.startsOn"),
      cell: ({ row }) => formatMonthString(row.original.startsOn, "monthYear"),
    },
    {
      accessorKey: "isActive",
      header: t("common.status"),
      cell: ({ row }) =>
        row.original.isActive
          ? t("budget.repeats.active")
          : t("budget.repeats.paused"),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("common.actions")}</span>,
      meta: { label: t("common.actions"), mobile: "actions" },
      cell: ({ row }) => <BudgetRowActions budget={row.original} />,
    },
  ];
}
