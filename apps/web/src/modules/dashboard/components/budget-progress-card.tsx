import { BudgetMeter } from "@/modules/budget/components/budget-meter";
import { useTranslate } from "@budget-manager/i18n/react";
import { buttonVariants } from "@budget-manager/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@budget-manager/ui/components/card";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { Link } from "@tanstack/react-router";
import type { BudgetProgress, BudgetTotals } from "@budget-manager/client";

/** How many meters fit before the card stops being scannable. */
const VISIBLE = 5;

/**
 * The dashboard's read on the budgets: worst-off first, since the point of the
 * widget is what needs acting on. The meters are the budget module's own, so a
 * bar here and a bar on the budget page cannot drift apart.
 */
export function BudgetProgressCard({
  budgets,
  totals,
  currencyCode,
  monthLabel,
}: {
  budgets: BudgetProgress[];
  totals: BudgetTotals | null;
  currencyCode: string;
  monthLabel: string;
}) {
  const t = useTranslate();
  const shown = budgets.slice(0, VISIBLE);
  const rest = budgets.length - shown.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.budgets.title")}</CardTitle>
        <CardDescription>
          {t("dashboard.budgets.description", { month: monthLabel })}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {shown.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("dashboard.budgets.empty")}
          </p>
        ) : (
          <ul className="space-y-4">
            {shown.map((budget) => (
              <BudgetMeter key={budget.periodId} budget={budget} />
            ))}
          </ul>
        )}
      </CardContent>

      <CardContent className="flex flex-row flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {totals
            ? t("dashboard.budgets.left", {
                amount: formatMinorUnits(totals.remainingCents, currencyCode),
              })
            : null}
          {rest > 0 && ` · ${t("dashboard.budgets.more", { count: rest })}`}
        </span>
        {/* A navigation target stays an <a>: Base UI's Button would force
            role="button" onto it. Borrow the styling instead. */}
        <Link to="/budget" className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("dashboard.budgets.action")}
        </Link>
      </CardContent>
    </Card>
  );
}
