import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@budget-manager/ui/components/card";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { WalletSlice } from "../types";

export function WalletBalancesCard({
  wallets,
  currencyCode,
}: {
  wallets: WalletSlice[];
  currencyCode: string;
}) {
  const ranked = [...wallets].sort((a, b) => b.balanceCents - a.balanceCents);
  // Scaled on the largest magnitude so an overdrawn wallet still gets a bar.
  const widest = ranked.reduce(
    (largest, item) => Math.max(largest, Math.abs(item.balanceCents)),
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallets</CardTitle>
        <CardDescription>Where this money sits.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {ranked.map((item) => {
            const negative = item.balanceCents < 0;
            const width =
              widest > 0 ? (Math.abs(item.balanceCents) / widest) * 100 : 0;
            const pending = item.projectedBalanceCents !== item.balanceCents;

            return (
              <li key={item.id} className="space-y-1.5">
                <div className="flex flex-row items-baseline justify-between gap-4">
                  <span className="truncate">{item.name}</span>
                  <span
                    className={`shrink-0 tabular-nums ${
                      negative ? "text-destructive" : ""
                    }`}
                  >
                    {formatMinorUnits(item.balanceCents, currencyCode)}
                  </span>
                </div>
                <div
                  className="h-2.5 w-full border border-border bg-chart-track/40"
                  role="presentation"
                >
                  <div
                    className={`h-full ${
                      negative ? "bg-chart-expense" : "bg-chart-1"
                    }`}
                    style={{ width: `${width}%` }}
                  />
                </div>
                {pending && (
                  <p className="text-xs text-muted-foreground">
                    {formatMinorUnits(
                      item.projectedBalanceCents,
                      currencyCode,
                    )}{" "}
                    once pending rows settle
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
