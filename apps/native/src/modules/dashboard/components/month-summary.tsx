import { useTranslate } from "@budget-manager/i18n/react";
import { View } from "react-native";

import { Amount } from "@/components/amount";
import { Card, CardHeader } from "@/components/ui/card";
import { Swatch } from "@/components/ui/swatch";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, SPACING } from "@/theme/tokens";

/**
 * The month in three figures, as rows rather than tiles. Three full-width stat tiles
 * spent most of a phone's first scroll on three numbers, and three tiles *across* is
 * worse: at ~110pt of content width `R$ 121.293,98` has nowhere to go but a second
 * line. A label on the left and its figure on the right never runs out of room,
 * whatever the amount or the language.
 *
 * The month is the card's own title, so each row needs no hint repeating it. Income
 * and Expenses carry the swatch that ties them to the bars below; Net is derived from
 * the two, so it is ruled off and wears plain ink.
 */
export function MonthSummary({
  monthLabel,
  currencyCode,
  incomeCents,
  expenseCents,
  netCents,
}: {
  monthLabel: string;
  currencyCode: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
}) {
  const t = useTranslate();
  const colors = useColors();

  return (
    <Card>
      <CardHeader title={monthLabel} />

      <View style={{ gap: SPACING.sm }}>
        <Row
          label={t("dashboard.stat.income")}
          swatch={colors.chartIncome}
          cents={incomeCents}
          currencyCode={currencyCode}
        />
        <Row
          label={t("dashboard.stat.expenses")}
          swatch={colors.chartExpense}
          cents={expenseCents}
          currencyCode={currencyCode}
        />
        <Row
          label={t("dashboard.stat.net")}
          cents={netCents}
          currencyCode={currencyCode}
          ruled
        />
      </View>
    </Card>
  );
}

function Row({
  label,
  swatch,
  cents,
  currencyCode,
  ruled = false,
}: {
  label: string;
  swatch?: string;
  cents: number;
  currencyCode: string;
  ruled?: boolean;
}) {
  const colors = useColors();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.md,
        paddingTop: ruled ? SPACING.sm : 0,
        borderTopWidth: ruled ? BORDER_WIDTH : 0,
        borderColor: colors.border,
      }}
    >
      {swatch ? <Swatch color={swatch} size={10} /> : null}
      <Text variant="meta" tone="muted" style={{ flex: 1 }} numberOfLines={1}>
        {label}
      </Text>
      {/* A figure step, not a title step. `cardTitle` is semibold, so these read
          lighter than the 18px bold amounts on a ledger row — a month's totals
          cannot be quieter than one transaction. `figureLine` is the step for a
          figure closing a line, the same one the net row and the hero splits take. */}
      <Amount cents={cents} currencyCode={currencyCode} variant="figureLine" />
    </View>
  );
}
