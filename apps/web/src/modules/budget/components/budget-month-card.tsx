import { Button } from "@budget-manager/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@budget-manager/ui/components/card";
import { useI18n, useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import {
  ArrowCounterClockwiseIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useResetBudgetPeriodMutation } from "@budget-manager/client/react";
import type { BudgetProgressRow, BudgetTotalsRow } from "@budget-manager/client";
import { BudgetMeter } from "./budget-meter";
import { EditBudgetPeriodDialog } from "./edit-budget-period-dialog";

function Figure({
  label,
  amountCents,
  currencyCode,
  negative,
}: {
  label: string;
  amountCents: number;
  currencyCode: string;
  negative?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-semibold tracking-[0.02em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={`font-heading text-lg font-semibold ${
          negative && amountCents < 0 ? "text-destructive" : ""
        }`}
      >
        {formatMinorUnits(amountCents, currencyCode)}
      </p>
    </div>
  );
}

function PeriodActions({ period }: { period: BudgetProgressRow }) {
  const { t, formatMonthString } = useI18n();
  const [editing, setEditing] = useState(false);
  const resetMutation = useResetBudgetPeriodMutation();

  // Two direct buttons rather than a menu: there are at most two actions here,
  // and a dropdown would put them one click further away while reintroducing the
  // per-row menu the listings deliberately dropped. Named by month as well as
  // category — the same category also owns a row in the list below.
  const forMonth = {
    name: period.categoryName,
    month: formatMonthString(period.periodMonth, "monthYear"),
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("budget.period.editFor", forMonth)}
        onClick={() => setEditing(true)}
      >
        <PencilSimpleIcon />
      </Button>
      {period.isOverride && period.budgetId && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("budget.period.resetFor", forMonth)}
          disabled={resetMutation.isPending}
          onClick={() => resetMutation.mutate({ id: period.periodId })}
        >
          <ArrowCounterClockwiseIcon />
        </Button>
      )}

      {editing && (
        <EditBudgetPeriodDialog
          key={period.periodId}
          period={period}
          open
          onOpenChange={setEditing}
        />
      )}
    </>
  );
}

/**
 * The month in view: what each category may spend and what it has spent. This
 * is the answer to "do I still have money to spend", so it leads the page and
 * sits above the list of limits that produced it.
 */
export function BudgetMonthCard({
  budgets,
  totals,
  currencyCode,
  monthLabel,
}: {
  budgets: BudgetProgressRow[];
  totals: BudgetTotalsRow | null;
  currencyCode: string;
  monthLabel: string;
}) {
  const t = useTranslate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("budget.month.title")}</CardTitle>
        <CardDescription>
          {t("budget.month.description", { month: monthLabel })}
        </CardDescription>
      </CardHeader>

      {totals && (
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Figure
            label={t("budget.totals.budgeted")}
            amountCents={totals.limitCents}
            currencyCode={currencyCode}
          />
          <Figure
            label={t("budget.totals.spent")}
            amountCents={totals.projectedSpentCents}
            currencyCode={currencyCode}
          />
          <Figure
            label={t("budget.totals.left")}
            amountCents={totals.remainingCents}
            currencyCode={currencyCode}
            negative
          />
        </CardContent>
      )}

      <CardContent>
        {budgets.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("budget.month.empty")}
          </p>
        ) : (
          <ul className="space-y-4">
            {budgets.map((budget) => (
              <BudgetMeter
                key={budget.periodId}
                budget={budget}
                action={<PeriodActions period={budget} />}
              />
            ))}
          </ul>
        )}
      </CardContent>

      {budgets.length > 0 && (
        <CardContent className="space-y-1 text-xs text-muted-foreground">
          <p>
            {totals && totals.exceededCount > 0
              ? totals.exceededCount === 1
                ? t("budget.totals.oneExceeded")
                : t("budget.totals.exceeded", { count: totals.exceededCount })
              : t("budget.totals.allWithin")}
          </p>
          <p>{t("budget.month.note")}</p>
        </CardContent>
      )}
    </Card>
  );
}
