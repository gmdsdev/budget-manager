import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@budget-manager/ui/components/card";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { CategorySpend } from "../types";

/**
 * One series, so one colour for every bar: shading them by size would spend the
 * only free channel restating the length.
 */
export function SpendingBreakdown({
  categories,
  currencyCode,
  monthLabel,
  expenseCents,
}: {
  categories: CategorySpend[];
  currencyCode: string;
  monthLabel: string;
  expenseCents: number;
}) {
  const largest = categories[0]?.amountCents ?? 0;
  const ranked = categories.reduce((total, category) => total + category.amountCents, 0);
  const rest = expenseCents - ranked;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top spending categories</CardTitle>
        <CardDescription>
          Where {monthLabel}&apos;s money went, largest first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No spending recorded this month.
          </p>
        ) : (
          <ul className="space-y-3">
            {categories.map((category) => {
              const share =
                expenseCents > 0
                  ? Math.round((category.amountCents / expenseCents) * 100)
                  : 0;
              // Bars are scaled against the largest one, so the top row always
              // fills the track and the rest read as a share of it.
              const width =
                largest > 0 ? (category.amountCents / largest) * 100 : 0;

              return (
                <li
                  key={category.categoryId ?? "uncategorized"}
                  className="space-y-1.5"
                >
                  <div className="flex flex-row items-baseline justify-between gap-4">
                    <span className="truncate">{category.name}</span>
                    <span className="shrink-0 tabular-nums">
                      {formatMinorUnits(category.amountCents, currencyCode)}
                      <span className="ml-2 text-muted-foreground">
                        {share}%
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted" role="presentation">
                    <div
                      className="h-full bg-chart-1"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      {rest > 0 && (
        <CardContent className="text-xs text-muted-foreground">
          {formatMinorUnits(rest, currencyCode)} more across other categories.
        </CardContent>
      )}
    </Card>
  );
}
