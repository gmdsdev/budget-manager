import { TransactionKindLabelMap } from "@budget-manager/schemas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@budget-manager/ui/components/card";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { formatDayLabel } from "../utils/month";

export type PendingItem = {
  id: string;
  name: string;
  kind: string;
  amountCents: number;
  occurrenceDate: string;
  walletName: string | null;
  creditCardName: string | null;
  walletCurrencyCode: string;
  categoryName: string | null;
};

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
                    <p className="truncate text-sm">
                      {item.name}
                      {overdue && (
                        <span className="ml-2 text-xs font-medium text-destructive">
                          Overdue
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
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
    </Card>
  );
}
