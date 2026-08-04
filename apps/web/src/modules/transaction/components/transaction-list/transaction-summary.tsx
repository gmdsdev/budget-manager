import type { TransactionSummaryRow } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CaretDownIcon,
  ClockIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useState } from "react";

const EYEBROW =
  "text-xs font-semibold tracking-[0.02em] text-muted-foreground uppercase";

function amountClass(amountCents: number) {
  return amountCents < 0 ? "text-destructive" : "";
}

/**
 * The two flow figures, as tiles on their own plane inside the card: what is
 * settled leads, and the delta still awaiting payment follows it. The projected
 * figure is not restated here — it is this sum, and the wallet balance and the
 * net line above and below already carry it.
 */
function FlowTile({
  figure,
  label,
  icon: Icon,
  iconClassName,
  amountCents,
  projectedCents,
  currencyCode,
}: {
  figure: string;
  label: string;
  icon: PhosphorIcon;
  iconClassName: string;
  amountCents: number;
  projectedCents: number;
  currencyCode: string;
}) {
  const { t } = useI18n();
  const waitingCents = projectedCents - amountCents;

  return (
    <div
      className="rounded-lg bg-muted p-4"
      data-summary-figure={figure}
      data-summary-effective={formatMinorUnits(amountCents, currencyCode)}
      data-summary-projected={formatMinorUnits(projectedCents, currencyCode)}
    >
      <p className={`flex flex-row items-center gap-1.5 ${EYEBROW}`}>
        <Icon aria-hidden className={`size-3.5 shrink-0 ${iconClassName}`} />
        {label}
      </p>
      <p
        className={`mt-1 font-heading text-2xl font-bold tracking-[-0.03em] tabular-nums ${amountClass(
          amountCents,
        )}`}
      >
        {formatMinorUnits(amountCents, currencyCode)}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {waitingCents > 0
          ? t("transaction.summary.waiting", {
              amount: formatMinorUnits(waitingCents, currencyCode),
            })
          : t("transaction.summary.settled")}
      </p>
    </div>
  );
}

/**
 * One currency is in view at a time, the same reading the dashboard takes: the
 * figures are never summed across currencies, and a section per currency read as
 * one long page of near-identical numbers. Switching costs no refetch — the
 * payload already carries every currency.
 */
function CurrencyTabs({
  currencies,
  activeCurrency,
  onSelect,
  label,
}: {
  currencies: TransactionSummaryRow[];
  activeCurrency: string;
  onSelect: (currencyCode: string) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex max-w-full shrink-0 flex-row gap-0.5 overflow-x-auto rounded-full bg-muted p-1"
    >
      {currencies.map((row) => {
        const active = row.currencyCode === activeCurrency;

        return (
          <button
            key={row.currencyCode}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(row.currencyCode)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {row.currencyCode}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The figures under the transaction list: the balance the period ends on leads,
 * the two flows follow it, and the net closes with a bar reading one against the
 * other.
 *
 * It was a four-by-two table of effective and projected columns, which gave the
 * eight figures equal weight and left the reader to work out which one answers
 * "how much have I got". Money-in and money-out state what is still waiting
 * rather than repeating a projected column, since the delta is the part worth
 * acting on.
 */
export function TransactionSummary({
  currencies,
  rangeTo,
  total,
  preferredCurrency,
  isFetching,
}: {
  currencies: TransactionSummaryRow[];
  /** The end of the range in view: what the balances are stated as of. */
  rangeTo: string;
  /** How many rows the figures cover — every match, not the page in view. */
  total: number;
  /** The account's default, which is a preference and never a scope. */
  preferredCurrency?: string;
  isFetching?: boolean;
}) {
  const { t, formatDateString } = useI18n();
  const [picked, setPicked] = useState<string | null>(null);

  // A picked currency wins, then the account's preference, then the first the
  // API returned — so a currency that stops existing can never blank the panel.
  const row =
    currencies.find((entry) => entry.currencyCode === picked) ??
    currencies.find((entry) => entry.currencyCode === preferredCurrency) ??
    currencies[0];

  if (!row) {
    return null;
  }

  const asOf = formatDateString(rangeTo, "numeric");
  const format = (amountCents: number) =>
    formatMinorUnits(amountCents, row.currencyCode);

  const pendingCents = Math.abs(
    row.projectedBalanceCents - row.balanceCents,
  );
  // Settled money in against settled money out, as a share of the two together.
  const settledFlowCents = Math.max(0, row.incomeCents) + Math.max(0, row.expenseCents);
  const incomeShare =
    settledFlowCents > 0
      ? (Math.max(0, row.incomeCents) / settledFlowCents) * 100
      : 0;

  return (
    <section
      aria-label={t("transaction.summary.heading")}
      // Held at reduced opacity on a refetch rather than swapped for a
      // skeleton, so changing a filter never jumps the page.
      className={`mt-4 rounded-xl border border-border bg-card transition-opacity dark:border-transparent ${
        isFetching ? "opacity-60" : ""
      }`}
    >
      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold tracking-[-0.015em]">
              {t("transaction.summary.heading")}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {total === 1
                ? t("transaction.summary.contextOne", { date: asOf })
                : t("transaction.summary.context", { count: total, date: asOf })}
            </p>
          </div>

          {/* A single-currency account has nothing to pick. */}
          {currencies.length > 1 && (
            <CurrencyTabs
              currencies={currencies}
              activeCurrency={row.currencyCode}
              onSelect={setPicked}
              label={t("common.currency")}
            />
          )}
        </div>

        <div
          data-summary-figure="wallets"
          data-summary-effective={format(row.balanceCents)}
          data-summary-projected={format(row.projectedBalanceCents)}
        >
          <p className={EYEBROW}>{t("transaction.summary.inWallets")}</p>
          <p
            className={`mt-1 font-heading text-3xl font-bold tracking-[-0.04em] tabular-nums sm:text-4xl ${amountClass(
              row.balanceCents,
            )}`}
          >
            {format(row.balanceCents)}
          </p>
          <p className="mt-1.5 flex flex-row items-center gap-1.5 text-sm text-muted-foreground">
            {pendingCents > 0 ? (
              <>
                <ClockIcon aria-hidden className="size-4 shrink-0" />
                {t("transaction.summary.walletsPending", {
                  projected: format(row.projectedBalanceCents),
                  waiting: format(pendingCents),
                })}
              </>
            ) : (
              t("transaction.summary.settled")
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FlowTile
            figure="income"
            label={t("transaction.summary.income")}
            icon={ArrowDownLeftIcon}
            iconClassName="text-success"
            amountCents={row.incomeCents}
            projectedCents={row.projectedIncomeCents}
            currencyCode={row.currencyCode}
          />
          <FlowTile
            figure="expenses"
            label={t("transaction.summary.expenses")}
            icon={ArrowUpRightIcon}
            iconClassName="text-content-secondary"
            amountCents={row.expenseCents}
            projectedCents={row.projectedExpenseCents}
            currencyCode={row.currencyCode}
          />
        </div>

        <div
          className="border-t border-border pt-4"
          data-summary-figure="net"
          data-summary-effective={format(row.netCents)}
          data-summary-projected={format(row.projectedNetCents)}
        >
          <div className="flex flex-row items-baseline justify-between gap-3">
            <p className="text-sm text-content-secondary">
              {t("transaction.summary.net")}
            </p>
            <p className="text-right">
              <span
                className={`font-heading text-xl font-bold tracking-[-0.03em] tabular-nums ${amountClass(
                  row.netCents,
                )}`}
              >
                {format(row.netCents)}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {row.projectedNetCents === row.netCents
                  ? t("transaction.summary.settled")
                  : t("transaction.summary.netProjected", {
                      amount: format(row.projectedNetCents),
                    })}
              </span>
            </p>
          </div>

          {/* Decoration: both figures are stated in full above it. */}
          <div
            aria-hidden
            className="mt-2.5 flex h-1.5 w-full flex-row overflow-hidden rounded-full bg-chart-track"
          >
            <div
              className="h-full bg-chart-income"
              style={{ width: `${incomeShare}%` }}
            />
            <div
              className="h-full bg-chart-expense"
              style={{
                width: `${settledFlowCents > 0 ? 100 - incomeShare : 0}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("transaction.summary.flowBar")}
          </p>
        </div>

        {/* Folded away rather than dropped: the two scopes that meet in this
            payload have to be stated somewhere, but they are read once. */}
        <details className="group border-t border-border pt-4">
          <summary className="flex cursor-pointer list-none flex-row items-center gap-1.5 text-sm text-content-secondary">
            <CaretDownIcon
              aria-hidden
              className="size-4 shrink-0 transition-transform group-open:rotate-180"
            />
            {t("transaction.summary.explain")}
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("transaction.summary.note", { date: asOf })}
          </p>
        </details>
      </div>
    </section>
  );
}
