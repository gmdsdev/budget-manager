import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@budget-manager/ui/components/card";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";

type CategorySpend = {
  categoryId: string | null;
  name: string;
  amountCents: number;
};

export type CurrencySummary = {
  currencyCode: string;
  walletCount: number;
  balanceCents: number;
  projectedBalanceCents: number;
  cardCount: number;
  cardOutstandingCents: number;
  cardAvailableCents: number;
  netWorthCents: number;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  topCategories: CategorySpend[];
};

function Figure({
  label,
  amountCents,
  currencyCode,
  tone,
}: {
  label: string;
  amountCents: number;
  currencyCode: string;
  tone?: "positive" | "negative" | "auto";
}) {
  const positive =
    tone === "positive" || (tone === "auto" && amountCents >= 0);
  const negative =
    tone === "negative" || (tone === "auto" && amountCents < 0);

  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-semibold tabular-nums ${
          positive ? "text-emerald-600 dark:text-emerald-400" : ""
        } ${negative ? "text-destructive" : ""}`}
      >
        {formatMinorUnits(amountCents, currencyCode)}
      </p>
    </div>
  );
}

export function CurrencySummaryCard({
  summary,
  monthLabel,
}: {
  summary: CurrencySummary;
  monthLabel: string;
}) {
  const hasPending = summary.projectedBalanceCents !== summary.balanceCents;
  const totalSpend = summary.topCategories.reduce(
    (total, category) => total + category.amountCents,
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{summary.currencyCode}</CardTitle>
        <CardDescription>
          {summary.walletCount === 1
            ? "1 wallet"
            : `${summary.walletCount} wallets`}
          {summary.cardCount > 0
            ? ` · ${summary.cardCount === 1 ? "1 card" : `${summary.cardCount} cards`}`
            : ""}
          {" · "}
          {monthLabel}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Figure
            label="In wallets"
            amountCents={summary.balanceCents}
            currencyCode={summary.currencyCode}
            tone="auto"
          />
          <Figure
            label="Income"
            amountCents={summary.incomeCents}
            currencyCode={summary.currencyCode}
          />
          <Figure
            label="Expenses"
            amountCents={summary.expenseCents}
            currencyCode={summary.currencyCode}
          />
          <Figure
            label="Net"
            amountCents={summary.netCents}
            currencyCode={summary.currencyCode}
            tone="auto"
          />
        </div>

        {summary.cardCount > 0 && (
          <div className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
            <Figure
              label="On cards"
              amountCents={summary.cardOutstandingCents}
              currencyCode={summary.currencyCode}
              tone={summary.cardOutstandingCents > 0 ? "negative" : undefined}
            />
            <Figure
              label="Credit available"
              amountCents={summary.cardAvailableCents}
              currencyCode={summary.currencyCode}
              tone="auto"
            />
            <div className="sm:col-span-2">
              <Figure
                label="Net position"
                amountCents={summary.netWorthCents}
                currencyCode={summary.currencyCode}
                tone="auto"
              />
              <p className="text-xs text-muted-foreground">
                Wallets minus what the cards owe.
              </p>
            </div>
          </div>
        )}

        {hasPending && (
          <p className="text-xs text-muted-foreground">
            {formatMinorUnits(
              summary.projectedBalanceCents,
              summary.currencyCode,
            )}{" "}
            projected once pending transactions settle. Income and expenses
            include pending rows and exclude transfers.
          </p>
        )}

        {summary.topCategories.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Top spending categories
            </p>
            <ul className="space-y-2">
              {summary.topCategories.map((category) => {
                const share =
                  totalSpend > 0
                    ? Math.round((category.amountCents / totalSpend) * 100)
                    : 0;

                return (
                  <li
                    key={category.categoryId ?? "uncategorized"}
                    className="space-y-1"
                  >
                    <div className="flex flex-row items-baseline justify-between gap-4 text-xs">
                      <span>{category.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatMinorUnits(
                          category.amountCents,
                          summary.currencyCode,
                        )}
                      </span>
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-none bg-muted"
                      role="presentation"
                    >
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
