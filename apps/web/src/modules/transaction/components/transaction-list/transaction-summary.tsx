import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@budget-manager/ui/components/table";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { Fragment } from "react";
import type { TransactionSummaryRow } from "@budget-manager/client";

/** Narrower than `MessageKey`: none of the four takes a placeholder, so `t`
 * can be called with the label alone. */
type MetricLabel =
  | "transaction.summary.inWallets"
  | "transaction.summary.income"
  | "transaction.summary.expenses"
  | "transaction.summary.net";

type Metric = {
  key: string;
  label: MetricLabel;
  effective: (row: TransactionSummaryRow) => number;
  projected: (row: TransactionSummaryRow) => number;
};

/**
 * Rows are the figures and columns are the currencies, not the other way round:
 * a user holds one currency far more often than six, and this way a second one
 * widens the table by two columns instead of doubling its rows.
 */
const METRICS: Metric[] = [
  {
    key: "wallets",
    label: "transaction.summary.inWallets",
    effective: (row) => row.balanceCents,
    projected: (row) => row.projectedBalanceCents,
  },
  {
    key: "income",
    label: "transaction.summary.income",
    effective: (row) => row.incomeCents,
    projected: (row) => row.projectedIncomeCents,
  },
  {
    key: "expenses",
    label: "transaction.summary.expenses",
    effective: (row) => row.expenseCents,
    projected: (row) => row.projectedExpenseCents,
  },
  {
    key: "net",
    label: "transaction.summary.net",
    effective: (row) => row.netCents,
    projected: (row) => row.projectedNetCents,
  },
];

/**
 * Two currencies are wider than a phone, so the figures scroll and the column
 * naming them has to stay put — a number whose row label has scrolled away is
 * unreadable.
 */
const STICKY_LABEL = "sticky left-0 z-10";

function amountClass(amountCents: number) {
  return amountCents < 0
    ? "text-right tabular-nums text-destructive"
    : "text-right tabular-nums";
}

export function TransactionSummary({
  currencies,
  rangeTo,
  isFetching,
}: {
  currencies: TransactionSummaryRow[];
  /** The end of the range in view: what the balances are stated as of. */
  rangeTo: string;
  isFetching?: boolean;
}) {
  const { t, formatDateString } = useI18n();

  if (currencies.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={t("transaction.summary.heading")}
      // Held at reduced opacity on a refetch rather than swapped for a
      // skeleton, so changing a filter never jumps the page.
      className={`mt-4 overflow-hidden rounded-xl border border-border bg-card transition-opacity dark:border-transparent ${
        isFetching ? "opacity-60" : ""
      }`}
    >
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-heading text-base font-bold tracking-[-0.015em]">
          {t("transaction.summary.heading")}
        </h2>
      </div>

      <Table>
        <TableCaption className="sr-only">
          {t("transaction.summary.caption")}
        </TableCaption>
        {/* Two header rows, so the second currency costs two columns instead of
            doubling the rows. */}
        <TableHeader className="[&_tr:first-child]:border-b-0">
          <TableRow>
            <TableHead rowSpan={2} className={`${STICKY_LABEL} bg-card`}>
              <span className="sr-only">{t("transaction.summary.figure")}</span>
            </TableHead>
            {currencies.map((row) => (
              <TableHead
                key={row.currencyCode}
                scope="colgroup"
                colSpan={2}
                className="border-l border-border text-center"
              >
                {row.currencyCode}
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            {currencies.map((row) => (
              <Fragment key={row.currencyCode}>
                <TableHead
                  scope="col"
                  className="border-l border-border text-right"
                >
                  {t("transaction.summary.effective")}
                </TableHead>
                <TableHead scope="col" className="text-right">
                  {t("transaction.summary.projected")}
                </TableHead>
              </Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {METRICS.map((metric) => (
            <TableRow key={metric.key} className="group">
              <TableHead
                scope="row"
                className={`${STICKY_LABEL} bg-card group-hover:bg-accent/40`}
              >
                {t(metric.label)}
              </TableHead>
              {currencies.map((row) => {
                const effective = metric.effective(row);
                const projected = metric.projected(row);

                return (
                  <Fragment key={row.currencyCode}>
                    <TableCell
                      className={`border-l border-border ${amountClass(
                        effective,
                      )}`}
                    >
                      {formatMinorUnits(effective, row.currencyCode)}
                    </TableCell>
                    <TableCell className={amountClass(projected)}>
                      {formatMinorUnits(projected, row.currencyCode)}
                    </TableCell>
                  </Fragment>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Outside the table: with a second currency the table scrolls sideways
          inside its own container, which would take this note with it. */}
      <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
        {t("transaction.summary.note", {
          date: formatDateString(rangeTo, "numeric"),
        })}
      </p>
    </section>
  );
}
