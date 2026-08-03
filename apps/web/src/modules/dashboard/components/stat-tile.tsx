import { Card, CardContent } from "@budget-manager/ui/components/card";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { ReactNode } from "react";

export function StatTile({
  label,
  amountCents,
  currencyCode,
  hint,
  swatch,
  lead = false,
  children,
}: {
  label: string;
  amountCents: number;
  currencyCode: string;
  hint?: ReactNode;
  /** A series colour, when the figure also appears as a mark in a chart. */
  swatch?: string;
  /** The figure the section leads with, set larger than the rest. */
  lead?: boolean;
  children?: ReactNode;
}) {
  // min-w-0: the sparkline inside starts at a fixed width, which would
  // otherwise stop the grid column from shrinking and overflow the page.
  return (
    <Card className="min-w-0 justify-between gap-3">
      <CardContent className="space-y-1">
        <p className="flex flex-row items-center gap-2 text-xs font-semibold tracking-[0.02em] text-muted-foreground uppercase">
          {swatch ? (
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: swatch }}
            />
          ) : null}
          {label}
        </p>
        {/* Ink, not a series colour — only money in the red earns a colour, and
            proportional figures read tighter than tabular ones at this size. */}
        {/* Two tiles to a row on a phone leaves ~140px of content width, which a
            six-figure amount overruns at the desktop sizes. */}
        <p
          className={`font-heading font-bold tracking-[-0.04em] ${
            lead ? "text-3xl sm:text-4xl" : "text-2xl sm:text-[2rem]"
          } ${amountCents < 0 ? "text-destructive" : ""}`}
        >
          {formatMinorUnits(amountCents, currencyCode)}
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
      {children ? <CardContent>{children}</CardContent> : null}
    </Card>
  );
}
