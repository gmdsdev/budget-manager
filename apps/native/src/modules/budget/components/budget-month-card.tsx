import { type BudgetProgressRow, type BudgetTotalsRow } from "@budget-manager/client";
import { useResetBudgetPeriodMutation } from "@budget-manager/client/react";
import { useI18n, useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { View } from "react-native";

import { Amount } from "@/components/amount";
import { IconButton } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { BudgetMeter } from "@/modules/budget/components/budget-meter";
import { EditBudgetPeriodSheet } from "@/modules/budget/components/edit-budget-period-sheet";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, SPACING } from "@/theme/tokens";

/**
 * The month in view: what each category may spend and what it has spent. This is the
 * answer to "do I still have money to spend", so it leads the screen and sits above
 * the list of limits that produced it.
 */
export function BudgetMonthCard({
  budgets,
  totals,
  currencyCode,
  monthLabel,
}: {
  budgets: BudgetProgressRow[];
  totals: BudgetTotalsRow | null;
  currencyCode: string;
  monthLabel: string;
}) {
  const t = useTranslate();

  return (
    <Card>
      <CardHeader
        title={t("budget.month.title")}
        description={t("budget.month.description", { month: monthLabel })}
      />

      {/* Rows, not three figures across. At a third of a phone's width each, `R$`
          broke onto its own line above its digits — the same reason the dashboard's
          stat tiles became `MonthSummary`. A label on the left and its figure on the
          right cannot run out of room. */}
      {totals && (
        <View style={{ gap: SPACING.sm }}>
          <Figure
            label={t("budget.totals.budgeted")}
            cents={totals.limitCents}
            currencyCode={currencyCode}
          />
          <Figure
            label={t("budget.totals.spent")}
            cents={totals.projectedSpentCents}
            currencyCode={currencyCode}
          />
          <Figure
            label={t("budget.totals.left")}
            cents={totals.remainingCents}
            currencyCode={currencyCode}
            ruled
          />
        </View>
      )}

      {budgets.length === 0 ? (
        <Text variant="meta" tone="muted">
          {t("budget.month.empty")}
        </Text>
      ) : (
        <View style={{ gap: SPACING.lg }}>
          {budgets.map((budget) => (
            <BudgetMeter
              key={budget.periodId}
              budget={budget}
              action={<PeriodActions period={budget} />}
            />
          ))}
        </View>
      )}

      {budgets.length > 0 && (
        <View style={{ gap: 2 }}>
          <Text variant="meta" tone="muted">
            {totals && totals.exceededCount > 0
              ? totals.exceededCount === 1
                ? t("budget.totals.oneExceeded")
                : t("budget.totals.exceeded", { count: totals.exceededCount })
              : t("budget.totals.allWithin")}
          </Text>
          <Text variant="meta" tone="muted">
            {t("budget.month.note")}
          </Text>
        </View>
      )}
    </Card>
  );
}

function Figure({
  label,
  cents,
  currencyCode,
  ruled = false,
}: {
  label: string;
  cents: number;
  currencyCode: string;
  /** What is left is derived from the two above it, so it is ruled off. */
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
      <Text variant="meta" tone="muted" style={{ flex: 1 }} numberOfLines={1}>
        {label}
      </Text>
      <Amount cents={cents} currencyCode={currencyCode} variant="cardTitle" />
    </View>
  );
}

/**
 * Two direct affordances rather than a menu: there are at most two actions here, and
 * a menu would put them one tap further away while reintroducing the per-row menu the
 * listings deliberately dropped. Named by month as well as category — the same
 * category also owns a row in the list below.
 */
function PeriodActions({ period }: { period: BudgetProgressRow }) {
  const { t, formatMonthString } = useI18n();
  const colors = useColors();
  const [editing, setEditing] = useState(false);
  const resetMutation = useResetBudgetPeriodMutation();

  const forMonth = {
    name: period.categoryName,
    month: formatMonthString(period.periodMonth, "monthYear"),
  };

  return (
    <>
      <IconButton
        label={t("budget.period.editFor", forMonth)}
        onPress={() => setEditing(true)}
      >
        <Feather name="edit-2" size={16} color={colors.foreground} />
      </IconButton>
      {period.isOverride && period.budgetId && (
        <IconButton
          label={t("budget.period.resetFor", forMonth)}
          disabled={resetMutation.isPending}
          onPress={() => resetMutation.mutate({ id: period.periodId })}
        >
          <Feather name="rotate-ccw" size={16} color={colors.foreground} />
        </IconButton>
      )}

      {editing && (
        <EditBudgetPeriodSheet
          key={period.periodId}
          period={period}
          open
          onOpenChange={setEditing}
        />
      )}
    </>
  );
}
