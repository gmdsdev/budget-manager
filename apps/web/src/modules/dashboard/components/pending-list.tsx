import { TransactionKindLabelMap } from "@budget-manager/schemas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@budget-manager/ui/components/card";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@budget-manager/ui/components/button";
import type { PendingItem } from "../types";
import { formatDayLabel } from "../utils/month";

export function PendingList({
  items,
  today,
}: {
  items: PendingItem[];
  today: string;
}) {
  const overdueCount = items.filter((item) => item.occurrenceDate < today)
    .length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Awaiting payment</CardTitle>
        <CardDescription>
          {overdueCount > 0
            ? `${overdueCount} overdue, oldest first.`
            : "Nothing overdue — soonest first."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nothing outstanding — you're all caught up.
          </p>
        ) : (
          <ul className="divide-y">
            {items.map((item) => {
              const overdue = item.occurrenceDate < today;

              return (
                <li
                  key={item.id}
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
                      {item.name}
                      {overdue && (
                        <span className="text-xs font-medium text-destructive">
                          Overdue
                        </span>
                      )}
                    </p>
                    <p className="pl-3.5 text-xs text-muted-foreground">
                      {formatDayLabel(item.occurrenceDate)} ·{" "}
                      {item.walletName ?? item.creditCardName ?? "—"}
                      {item.categoryName ? ` · ${item.categoryName}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm tabular-nums ${
                        overdue ? "text-destructive" : ""
                      }`}
                    >
                      {formatMinorUnits(
                        item.amountCents,
                        item.walletCurrencyCode,
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {TransactionKindLabelMap[
                        item.kind as keyof typeof TransactionKindLabelMap
                      ] ?? item.kind}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      {items.length > 0 && (
        <CardContent className="pt-0">
          <Link
            to="/transaction"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Open transactions
          </Link>
        </CardContent>
      )}
    </Card>
  );
}
