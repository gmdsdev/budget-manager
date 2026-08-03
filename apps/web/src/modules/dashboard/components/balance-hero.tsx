import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import type { ReactNode } from "react";

/**
 * The one figure the page is answering — "how much have I got" — set on the
 * brand plane rather than in the grid of tiles, so the eye lands on it first,
 * with the one action worth taking from here opposite it.
 *
 * The panel is always bright green with forest-green ink in both themes: it is
 * the brand surface, not a themed one, which is why the colours are literal
 * here instead of reading `--foreground`.
 */
export function BalanceHero({
  label,
  amountCents,
  currencyCode,
  note,
  splits,
  action,
}: {
  label: string;
  amountCents: number;
  currencyCode: string;
  note?: ReactNode;
  splits?: readonly { key: string; label: string; amountCents: number }[];
  /** The one thing to do from here. Sits opposite the figure above sm. */
  action?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 rounded-2xl bg-wise-bright-green p-6 text-wise-forest-green sm:flex-row sm:items-start sm:justify-between sm:p-8">
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-[0.02em] uppercase opacity-60">
          {label}
        </p>
        <p className="mt-2 text-4xl font-bold tracking-[-0.045em] sm:text-6xl">
          {formatMinorUnits(amountCents, currencyCode)}
        </p>
        {note ? <div className="mt-1 text-sm opacity-70">{note}</div> : null}

        {splits && splits.length > 0 ? (
          <dl className="mt-6 flex flex-row flex-wrap gap-x-10 gap-y-4">
            {splits.map((split) => (
              <div key={split.key} className="flex flex-col">
                <dt className="text-xs font-semibold tracking-[0.02em] uppercase opacity-60">
                  {split.label}
                </dt>
                <dd className="text-xl font-bold tracking-[-0.025em]">
                  {formatMinorUnits(split.amountCents, currencyCode)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </section>
  );
}
