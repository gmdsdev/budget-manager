import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@budget-manager/ui/components/card";
import { buttonVariants } from "@budget-manager/ui/components/button";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { StatementDue } from "../types";
import { formatDayLabel } from "../utils/month";

const STATUS_LABELS: Record<string, string> = {
  open: "Still open",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
};

export function StatementsDueList({
  statements,
  today,
}: {
  statements: StatementDue[];
  today: string;
}) {
  const overdueCount = statements.filter((bill) => bill.dueAt < today).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Card statements</CardTitle>
        <CardDescription>
          {overdueCount === 0
            ? "What your cards still owe, soonest due first."
            : overdueCount === 1
              ? "1 past its due date."
              : `${overdueCount} past their due date.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {statements.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nothing outstanding on your cards.
          </p>
        ) : (
          <ul className="divide-y">
            {statements.map((bill) => {
              const overdue = bill.dueAt < today;
              const partiallyPaid = bill.paidCents > 0;

              return (
                <li
                  key={bill.id}
                  className="flex flex-row items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="flex flex-row items-center gap-2 truncate text-sm">
                      <span
                        aria-hidden
                        className={`size-1.5 shrink-0 ${
                          overdue ? "bg-destructive" : "bg-muted-foreground/40"
                        }`}
                      />
                      {bill.creditCardName}
                      {overdue && (
                        <span className="text-xs font-medium text-destructive">
                          Overdue
                        </span>
                      )}
                    </p>
                    <p className="pl-3.5 text-xs text-muted-foreground">
                      Due {formatDayLabel(bill.dueAt)} ·{" "}
                      {formatDayLabel(bill.periodStart)}–
                      {formatDayLabel(bill.periodEnd)} ·{" "}
                      {STATUS_LABELS[bill.status] ?? bill.status}
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
                        {formatMinorUnits(bill.paidCents, bill.currencyCode)} of{" "}
                        {formatMinorUnits(
                          bill.statementTotalCents,
                          bill.currencyCode,
                        )}{" "}
                        paid
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
            Record a payment
          </Link>
        </CardContent>
      )}
    </Card>
  );
}
