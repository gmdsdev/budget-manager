import { getErrorMessage } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { BudgetStatus } from "@budget-manager/schemas";
import { Button } from "@budget-manager/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@budget-manager/ui/components/dialog";
import { Skeleton } from "@budget-manager/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@budget-manager/ui/components/table";
import { useIsCompact } from "@budget-manager/ui/hooks/use-media-query";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useBudgetPeriodsQuery } from "@budget-manager/client/react";
import type { BudgetProgressRow, BudgetRow } from "@budget-manager/client";
import { EditBudgetPeriodDialog } from "./edit-budget-period-dialog";

const STATUS_TONE: Record<BudgetStatus, string> = {
  [BudgetStatus.ON_TRACK]: "text-muted-foreground",
  [BudgetStatus.WARNING]: "text-warning",
  [BudgetStatus.EXCEEDED]: "text-destructive",
};

function EditButton({
  period,
  onEdit,
}: {
  period: BudgetProgressRow;
  onEdit: (period: BudgetProgressRow) => void;
}) {
  const { t, formatMonthString } = useI18n();

  return (
    <Button variant="ghost" size="icon-sm" onClick={() => onEdit(period)}>
      <PencilSimpleIcon />
      <span className="sr-only">
        {t("common.actionsFor", {
          name: formatMonthString(period.periodMonth, "monthYear"),
        })}
      </span>
    </Button>
  );
}

/**
 * One card per row below md, the same swap the listings make: five columns of
 * money in a dialog on a phone puts the ones the dialog exists to show off the
 * side of the screen.
 */
function PeriodCards({
  periods,
  onEdit,
}: {
  periods: BudgetProgressRow[];
  onEdit: (period: BudgetProgressRow) => void;
}) {
  const { t, formatMonthString } = useI18n();

  return (
    <ul
      aria-label={t("budget.periods.caption")}
      className="divide-y divide-border overflow-hidden rounded-lg border border-border"
    >
      {periods.map((period) => (
        <li key={period.periodId} className="space-y-2 p-3">
          <div className="flex flex-row items-start justify-between gap-2">
            <span className="min-w-0 flex-1 text-sm font-medium">
              {formatMonthString(period.periodMonth, "monthYear")}
            </span>
            <span
              className={`shrink-0 text-sm tabular-nums ${
                period.remainingCents < 0 ? "text-destructive" : ""
              }`}
            >
              {formatMinorUnits(period.remainingCents, period.currencyCode)}
            </span>
            <EditButton period={period} onEdit={onEdit} />
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt className="text-muted-foreground">
              {t("budget.column.limit")}
            </dt>
            <dd className="text-right tabular-nums">
              {formatMinorUnits(period.limitCents, period.currencyCode)}
            </dd>

            <dt className="text-muted-foreground">
              {t("budget.column.spent")}
            </dt>
            <dd className="text-right tabular-nums">
              {formatMinorUnits(
                period.projectedSpentCents,
                period.currencyCode,
              )}
            </dd>

            <dt className="text-muted-foreground">{t("common.status")}</dt>
            <dd className={`text-right ${STATUS_TONE[period.status]}`}>
              {t(`enum.budgetStatus.${period.status}`)}
            </dd>

            <dt className="text-muted-foreground">{t("common.type")}</dt>
            <dd className="text-right">
              {period.isOverride
                ? t("budget.periods.custom")
                : t("budget.periods.inherited")}
            </dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}

/**
 * Every month one budget covers. This is where a single recurrence entry is
 * edited — the months ahead of the one in view included, which the month card
 * on the page itself cannot reach.
 */
export function BudgetPeriodsDialog({
  budget,
  open,
  onOpenChange,
}: {
  budget: BudgetRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, formatMonthString } = useI18n();
  const isCompact = useIsCompact();
  const [editing, setEditing] = useState<BudgetProgressRow | null>(null);
  const { data, isPending, isError, error } = useBudgetPeriodsQuery(
    open ? budget.id : null,
  );

  const periods: BudgetProgressRow[] = data?.rows ?? [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("budget.periods.title", { name: budget.categoryName })}
            </DialogTitle>
            <DialogDescription>
              {t("budget.periods.description")}
            </DialogDescription>
          </DialogHeader>

          {isPending ? (
            <div
              className="space-y-2"
              role="status"
              aria-label={t("budget.periods.loading")}
            >
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
          ) : periods.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("budget.periods.empty")}
            </p>
          ) : isCompact ? (
            <PeriodCards periods={periods} onEdit={setEditing} />
          ) : (
            <div className="overflow-x-auto border border-border">
              <Table>
                <caption className="sr-only">
                  {t("budget.periods.caption")}
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">
                      {t("budget.column.month")}
                    </TableHead>
                    <TableHead scope="col">
                      {t("budget.column.limit")}
                    </TableHead>
                    <TableHead scope="col">
                      {t("budget.column.spent")}
                    </TableHead>
                    <TableHead scope="col">
                      {t("budget.column.remaining")}
                    </TableHead>
                    <TableHead scope="col">{t("common.status")}</TableHead>
                    <TableHead scope="col">
                      <span className="sr-only">{t("common.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((period) => (
                    <TableRow key={period.periodId}>
                      <TableCell className="whitespace-nowrap">
                        {formatMonthString(period.periodMonth, "monthYear")}
                        {period.isOverride && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {t("budget.periods.custom")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums whitespace-nowrap">
                        {formatMinorUnits(
                          period.limitCents,
                          period.currencyCode,
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums whitespace-nowrap">
                        {formatMinorUnits(
                          period.projectedSpentCents,
                          period.currencyCode,
                        )}
                      </TableCell>
                      <TableCell
                        className={`tabular-nums whitespace-nowrap ${
                          period.remainingCents < 0 ? "text-destructive" : ""
                        }`}
                      >
                        {formatMinorUnits(
                          period.remainingCents,
                          period.currencyCode,
                        )}
                      </TableCell>
                      <TableCell
                        className={`whitespace-nowrap ${STATUS_TONE[period.status]}`}
                      >
                        {t(`enum.budgetStatus.${period.status}`)}
                      </TableCell>
                      <TableCell className="text-right">
                        <EditButton period={period} onEdit={setEditing} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {editing && (
        <EditBudgetPeriodDialog
          key={editing.periodId}
          period={editing}
          open
          onOpenChange={(next) => !next && setEditing(null)}
        />
      )}
    </>
  );
}
