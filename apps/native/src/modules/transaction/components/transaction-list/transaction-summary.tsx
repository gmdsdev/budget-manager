import type { TransactionSummaryRow } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { View } from "react-native";

import { Amount } from "@/components/amount";
import { Plate } from "@/components/ui/plate";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, PLATE_BORDER_WIDTH, SPACING } from "@/theme/tokens";

/**
 * Narrower than `MessageKey`: none of the four takes a placeholder, so `t` can be
 * called with the label alone.
 */
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
 * The ledger closes with its totals, between the rows and the pagination. Totals are
 * never summed across currencies — there are no FX rates, so a single figure would
 * be fiction — so a second currency gets a block of its own rather than a wider
 * table nobody can read on a phone.
 *
 * Two scopes deliberately meet here, which the note states: balances cover every
 * active wallet up to the end of the range, while income and expenses cover exactly
 * the rows the filters matched.
 */
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
  const colors = useColors();

  if (currencies.length === 0) {
    return null;
  }

  return (
    <Plate
      // Held at reduced opacity on a refetch rather than swapped for a skeleton,
      // so changing a filter never jumps the screen.
      style={{ opacity: isFetching ? 0.6 : 1 }}
    >
      <View
        style={{
          borderBottomWidth: PLATE_BORDER_WIDTH,
          borderColor: colors.border,
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm,
        }}
      >
        <Text variant="h3">{t("transaction.summary.heading")}</Text>
      </View>

      {currencies.map((row, index) => (
        <View
          key={row.currencyCode}
          style={{
            padding: SPACING.md,
            gap: SPACING.sm,
            borderTopWidth: index > 0 ? BORDER_WIDTH : 0,
            borderColor: colors.muted,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: SPACING.sm,
            }}
          >
            <Text variant="h3">{row.currencyCode}</Text>
            <View style={{ flexDirection: "row", gap: SPACING.lg }}>
              <Text variant="tiny" tone="muted">
                {t("transaction.summary.effective")}
              </Text>
              <Text variant="tiny" tone="muted">
                {t("transaction.summary.projected")}
              </Text>
            </View>
          </View>

          {METRICS.map((metric) => (
            <View
              key={metric.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: SPACING.sm,
              }}
            >
              <Text variant="small" tone="muted" style={{ flex: 1 }}>
                {t(metric.label)}
              </Text>
              <View style={{ width: "30%", alignItems: "flex-end" }}>
                <Amount
                  cents={metric.effective(row)}
                  currencyCode={row.currencyCode}
                  variant="small"
                />
              </View>
              <View style={{ width: "30%", alignItems: "flex-end" }}>
                <Amount
                  cents={metric.projected(row)}
                  currencyCode={row.currencyCode}
                  variant="small"
                />
              </View>
            </View>
          ))}
        </View>
      ))}

      <View
        style={{
          borderTopWidth: BORDER_WIDTH,
          borderColor: colors.muted,
          padding: SPACING.md,
        }}
      >
        <Text variant="tiny" tone="muted">
          {t("transaction.summary.note", {
            date: formatDateString(rangeTo, "numeric"),
          })}
        </Text>
      </View>
    </Plate>
  );
}
