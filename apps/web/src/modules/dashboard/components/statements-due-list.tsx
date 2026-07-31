import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@budget-manager/ui/components/card";
import { useI18n } from "@budget-manager/i18n/react";
import { buttonVariants } from "@budget-manager/ui/components/button";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { StatementDue } from "../types";

// `as const` keeps each value a literal key, so `t` can see that none of them
// takes a placeholder.
const STATUS_KEYS = {
  open: "dashboard.statements.status.open",
  awaiting_payment: "dashboard.statements.status.awaiting_payment",
  paid: "dashboard.statements.status.paid",
} as const;

function isKnownStatus(status: string): status is keyof typeof STATUS_KEYS {
  return status in STATUS_KEYS;
}

export function StatementsDueList({
  statements,
  today,
}: {
  statements: StatementDue[];
  today: string;
}) {
  const { t, formatDateString } = useI18n();
  const overdueCount = statements.filter((bill) => bill.dueAt < today).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.statements.title")}</CardTitle>
        <CardDescription>
          {overdueCount === 0
            ? t("dashboard.statements.none")
            : overdueCount === 1
              ? t("dashboard.statements.oneOverdue")
              : t("dashboard.statements.overdue", { count: overdueCount })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {statements.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("dashboard.statements.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border/25">
            {statements.map((bill) => {
              const overdue = bill.dueAt < today;
              const partiallyPaid = bill.paidCents > 0;

              return (
                <li
                  key={bill.id}
                  className="flex flex-row items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    {/* truncate belongs on the name, not the row: on the row it
                        clips whichever child runs off the end, which on a phone
                        is the Overdue flag. */}
                    <p className="flex flex-row items-center gap-2 text-sm">
                      <span
                        aria-hidden
                        className={`size-1.5 shrink-0 ${
                          overdue ? "bg-destructive" : "bg-muted-foreground/40"
                        }`}
                      />
                      <span className="truncate">{bill.creditCardName}</span>
                      {overdue && (
                        <span className="shrink-0 text-xs font-medium text-destructive">
                          {t("dashboard.pending.overdueFlag")}
                        </span>
                      )}
                    </p>
                    <p className="pl-3.5 text-xs text-muted-foreground">
                      {t("dashboard.statements.due", {
                        date: formatDateString(bill.dueAt, "monthDay"),
                      })}{" "}
                      · {formatDateString(bill.periodStart, "monthDay")}–
                      {formatDateString(bill.periodEnd, "monthDay")} ·{" "}
                      {isKnownStatus(bill.status)
                        ? t(STATUS_KEYS[bill.status])
                        : bill.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm tabular-nums ${
                        overdue ? "text-destructive" : ""
                      }`}
                    >
                      {formatMinorUnits(bill.remainingCents, bill.currencyCode)}
                    </p>
                    {partiallyPaid && (
                      <p className="text-xs text-muted-foreground">
                        {t("dashboard.statements.partiallyPaid", {
                          paid: formatMinorUnits(
                            bill.paidCents,
                            bill.currencyCode,
                          ),
                          total: formatMinorUnits(
                            bill.statementTotalCents,
                            bill.currencyCode,
                          ),
                        })}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      {statements.length > 0 && (
        <CardContent className="pt-0">
          <Link
            to="/transaction"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("dashboard.statements.action")}
          </Link>
        </CardContent>
      )}
    </Card>
  );
}
