import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { ClockIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import {
  amountClass,
  EYEBROW,
  PairCell,
  projectedClass,
  SplitBar,
} from "@/components/summary-figures";

/**
 * The one figure the page is answering — "how much have I got" — stated the
 * way the transaction totals state it: on a card rather than a high-contrast
 * plane, with settled and projected as labelled peers and the split bar
 * showing how much of the projection is already real. The one action worth
 * taking from here sits opposite it.
 */
export function BalanceHero({
  label,
  amountCents,
  projectedAmountCents,
  currencyCode,
  context,
  splits,
  action,
}: {
  label: string;
  amountCents: number;
  projectedAmountCents: number;
  currencyCode: string;
  /** The scope line: the currency, the accounts behind it, the month. */
  context: string;
  splits?: readonly { key: string; label: string; amountCents: number }[];
  /** The one thing to do from here. Sits opposite the figure above sm. */
  action?: ReactNode;
}) {
  const { t } = useI18n();
  const format = (cents: number) => formatMinorUnits(cents, currencyCode);
  const waitingCents = Math.abs(projectedAmountCents - amountCents);
  // Pending expenses can project the balance below the settled figure, and a
  // settled share of that projection means nothing — the pair and the waiting
  // caption still state both readings.
  const showBar = amountCents >= 0 && projectedAmountCents > amountCents;

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6 dark:border-transparent">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className={EYEBROW}>{label}</p>
          {waitingCents > 0 ? (
            <>
              <div className="mt-2 flex flex-row flex-wrap gap-x-8 gap-y-1">
                <PairCell
                  label={t("transaction.summary.effective")}
                  value={format(amountCents)}
                  valueClassName={`text-3xl font-bold tracking-[-0.04em] sm:text-4xl ${amountClass(
                    amountCents,
                  )}`}
                />
                <PairCell
                  label={t("transaction.summary.projected")}
                  value={format(projectedAmountCents)}
                  valueClassName={`text-3xl font-semibold tracking-[-0.04em] sm:text-4xl ${projectedClass(
                    projectedAmountCents,
                  )}`}
                />
              </div>
              {showBar && (
                <SplitBar
                  settledCents={amountCents}
                  projectedCents={projectedAmountCents}
                />
              )}
              <p className="mt-2 flex flex-row items-center gap-1.5 text-sm text-muted-foreground">
                <ClockIcon aria-hidden className="size-4 shrink-0" />
                {t("transaction.summary.waiting", {
                  amount: format(waitingCents),
                })}
              </p>
            </>
          ) : (
            <>
              <p
                className={`mt-1 font-heading text-3xl font-bold tracking-[-0.04em] tabular-nums sm:text-4xl ${amountClass(
                  amountCents,
                )}`}
              >
                {format(amountCents)}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t("transaction.summary.settled")}
              </p>
            </>
          )}

          <p className="mt-2 text-sm text-muted-foreground">{context}</p>

          {splits && splits.length > 0 ? (
            <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {splits.map((split) => (
                <div key={split.key} className="rounded-lg bg-muted p-4">
                  <dt className={EYEBROW}>{split.label}</dt>
                  <dd
                    className={`mt-1 font-heading text-xl font-bold tracking-[-0.025em] tabular-nums ${amountClass(
                      split.amountCents,
                    )}`}
                  >
                    {format(split.amountCents)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}
