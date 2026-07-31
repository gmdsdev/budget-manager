import { type EnumLabels, useEnumLabels } from "@/lib/enum-labels";
import type { Translate } from "@budget-manager/i18n";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import type { WalletRow } from "../../types";
import { WalletRowActions } from "./wallet-row-actions";

/**
 * A hook rather than a module constant: headers and enum cells are now
 * translations, so they have to be read inside the render a language change
 * re-runs. All four listings follow this shape.
 */
export function useWalletColumns(): ColumnDef<WalletRow>[] {
  const t = useTranslate();
  const labels = useEnumLabels();

  return useMemo(() => walletColumns(t, labels), [t, labels]);
}

function walletColumns(
  t: Translate,
  labels: EnumLabels,
): ColumnDef<WalletRow>[] {
  return [
    {
      accessorKey: "name",
      header: t("common.name"),
      meta: { mobile: "primary", grow: true },
    },
    {
      accessorKey: "type",
      header: t("common.type"),
      cell: ({ row }) => labels.walletType(row.original.type),
    },
    {
      accessorKey: "currencyCode",
      header: t("common.currency"),
      cell: ({ row }) => labels.currency(row.original.currencyCode),
    },
    {
      accessorKey: "openingBalanceCents",
      header: () => (
        <span className="block text-right">
          {t("wallet.column.openingBalance")}
        </span>
      ),
      meta: { label: t("wallet.column.openingBalance") },
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
      accessorKey: "balanceCents",
      header: () => (
        <span className="block text-right">{t("wallet.column.balance")}</span>
      ),
      meta: { label: t("wallet.column.balance"), mobile: "trailing" },
      cell: ({ row }) => {
        const { balanceCents, projectedBalanceCents, currencyCode } =
          row.original;
        const hasPending = projectedBalanceCents !== balanceCents;

        return (
          <span className="block text-right tabular-nums">
            <span className={balanceCents < 0 ? "text-destructive" : undefined}>
              {formatMinorUnits(balanceCents, currencyCode)}
            </span>
            {hasPending && (
              <span className="block text-xs text-muted-foreground">
                {t("wallet.projected", {
                  amount: formatMinorUnits(projectedBalanceCents, currencyCode),
                })}
              </span>
            )}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("common.actions")}</span>,
      meta: { label: t("common.actions"), mobile: "actions" },
      cell: ({ row }) => <WalletRowActions wallet={row.original} />,
    },
  ];
}
