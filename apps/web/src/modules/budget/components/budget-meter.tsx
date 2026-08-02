import { categoryColorVar } from "@/modules/category/colors";
import { CategoryLabel } from "@/modules/category/components/category-dot";
import { useTranslate } from "@budget-manager/i18n/react";
import { BudgetStatus } from "@budget-manager/schemas";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { ReactNode } from "react";
import type { BudgetProgressRow } from "@budget-manager/client";

/**
 * The bar is plain HTML rather than a chart mark: it carries a long category
 * name and its own value labels, which an SVG bar would clip. The fill is the
 * category's own ink, so the same hue means the same category here, in the
 * ledger and in the dashboard's spending breakdown — and the track is what
 * carries the *reading*, since a pastel fill may never be the only signal.
 */
export function BudgetMeter({
  budget,
  action,
}: {
  budget: BudgetProgressRow;
  /** A row menu, when the meter is somewhere the limit can be edited. */
  action?: ReactNode;
}) {
  const t = useTranslate();
  const over = budget.remainingCents < 0;
  // Clamped so an overspent budget fills the track rather than overflowing it;
  // the figure beside it is what states by how much.
  const width = Math.min(100, Math.max(0, budget.usedRatio * 100));
  const settledWidth = Math.min(
    width,
    budget.limitCents > 0
      ? Math.max(0, (budget.spentCents / budget.limitCents) * 100)
      : 0,
  );

  return (
    <li className="space-y-1.5">
      <div className="flex flex-row items-baseline justify-between gap-2">
        <CategoryLabel
          color={budget.categoryColor}
          name={budget.categoryName}
        />
        <div className="flex shrink-0 flex-row items-center gap-1">
          <span
            className={`tabular-nums ${over ? "text-destructive" : ""}`}
          >
            {over
              ? t("budget.meter.over", {
                  amount: formatMinorUnits(
                    Math.abs(budget.remainingCents),
                    budget.currencyCode,
                  ),
                })
              : t("budget.meter.remaining", {
                  amount: formatMinorUnits(
                    budget.remainingCents,
                    budget.currencyCode,
                  ),
                })}
          </span>
          {action}
        </div>
      </div>

      <div
        className="flex h-2.5 w-full flex-row border border-border bg-chart-track/40"
        role="presentation"
      >
        {/* Two segments, not two bars: what is already paid reads solid and the
            rest of the commitment reads faded, inside one track. */}
        <div
          className="h-full"
          style={{
            width: `${settledWidth}%`,
            backgroundColor: over
              ? "var(--chart-expense)"
              : categoryColorVar(budget.categoryColor),
          }}
        />
        <div
          className="h-full opacity-50"
          style={{
            width: `${Math.max(0, width - settledWidth)}%`,
            backgroundColor: over
              ? "var(--chart-expense)"
              : categoryColorVar(budget.categoryColor),
          }}
        />
      </div>

      <div className="flex flex-row flex-wrap items-baseline justify-between gap-x-3 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {t("budget.meter.spentOfLimit", {
            spent: formatMinorUnits(
              budget.projectedSpentCents,
              budget.currencyCode,
            ),
            limit: formatMinorUnits(budget.limitCents, budget.currencyCode),
          })}
        </span>
        <span className="flex flex-row items-center gap-2">
          {budget.isOverride && <span>{t("budget.meter.overridden")}</span>}
          <span
            className={
              budget.status === BudgetStatus.EXCEEDED
                ? "text-destructive"
                : budget.status === BudgetStatus.WARNING
                  ? "text-warning"
                  : ""
            }
          >
            {t(`enum.budgetStatus.${budget.status}`)}
          </span>
        </span>
      </div>
    </li>
  );
}
