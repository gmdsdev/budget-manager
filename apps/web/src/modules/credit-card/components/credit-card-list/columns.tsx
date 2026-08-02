import type { Translate } from "@budget-manager/i18n";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import type { CreditCardRow } from "@budget-manager/client";
import { CreditCardRowActions } from "./credit-card-row-actions";

export function useCreditCardColumns(): ColumnDef<CreditCardRow>[] {
  const t = useTranslate();

  return useMemo(() => creditCardColumns(t), [t]);
}

function creditCardColumns(t: Translate): ColumnDef<CreditCardRow>[] {
  return [
    {
      accessorKey: "name",
      header: t("common.name"),
      meta: { mobile: "primary", grow: true },
    },
    {
      accessorKey: "currencyCode",
      header: t("common.currency"),
    },
    {
      id: "cycle",
      header: t("creditCard.column.cycle"),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {t("creditCard.column.cycleValue", {
            closeDay: row.original.closeDay,
            dueDay: row.original.dueDay,
          })}
        </span>
      ),
    },
    {
      accessorKey: "defaultBillingWalletName",
      header: t("creditCard.column.billingWallet"),
      cell: ({ row }) =>
        row.original.defaultBillingWalletName ?? t("common.none"),
    },
    {
      accessorKey: "limitCents",
      header: () => (
        <span className="block text-right">{t("creditCard.column.limit")}</span>
      ),
      meta: { label: t("creditCard.column.limit") },
      cell: ({ row }) => (
        <span className="block text-right tabular-nums">
          {formatMinorUnits(row.original.limitCents, row.original.currencyCode)}
        </span>
      ),
    },
    {
      accessorKey: "outstandingCents",
      header: () => (
        <span className="block text-right">
          {t("creditCard.column.outstanding")}
        </span>
      ),
      meta: { label: t("creditCard.column.outstanding"), mobile: "trailing" },
      cell: ({ row }) => {
        const { outstandingCents, projectedOutstandingCents, currencyCode } =
          row.original;
        const hasPending = projectedOutstandingCents !== outstandingCents;

        return (
          <span className="block text-right tabular-nums">
            <span
              className={outstandingCents > 0 ? "text-destructive" : undefined}
            >
              {formatMinorUnits(outstandingCents, currencyCode)}
            </span>
            {hasPending && (
              <span className="block text-xs text-muted-foreground">
                {t("creditCard.projected", {
                  amount: formatMinorUnits(
                    projectedOutstandingCents,
                    currencyCode,
                  ),
                })}
              </span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "availableCents",
      header: () => (
        <span className="block text-right">
          {t("creditCard.column.available")}
        </span>
      ),
      meta: { label: t("creditCard.column.available") },
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
      header: () => <span className="sr-only">{t("common.actions")}</span>,
      meta: { label: t("common.actions"), mobile: "actions" },
      cell: ({ row }) => <CreditCardRowActions card={row.original} />,
    },
  ];
}
