import { type BudgetProgressRow, type BudgetTotalsRow } from "@budget-manager/client";
import { useResetBudgetPeriodMutation } from "@budget-manager/client/react";
import { useI18n, useTranslate } from "@budget-manager/i18n/react";
import { useState } from "react";
import { View } from "react-native";

import { Amount } from "@/components/amount";
import { Card, CardHeader } from "@/components/ui/card";
import { RowMenu } from "@/components/ui/row-menu";
import { Text } from "@/components/ui/text";
import { BudgetMeter } from "@/modules/budget/components/budget-meter";
import {
  EditBudgetPeriodSheet,
} from "@/modules/budget/components/edit-budget-period-sheet";
import { SPACING } from "@/theme/tokens";

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

      {totals && (
        <View style={{ flexDirection: "row", gap: SPACING.md }}>
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
          />
        </View>
      )}

      {budgets.length === 0 ? (
        <Text variant="tiny" tone="muted">
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
          <Text variant="tiny" tone="muted">
            {totals && totals.exceededCount > 0
              ? totals.exceededCount === 1
                ? t("budget.totals.oneExceeded")
                : t("budget.totals.exceeded", { count: totals.exceededCount })
              : t("budget.totals.allWithin")}
          </Text>
          <Text variant="tiny" tone="muted">
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
}: {
  label: string;
  cents: number;
  currencyCode: string;
}) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text variant="tiny" tone="muted">
        {label.toUpperCase()}
      </Text>
      <Amount cents={cents} currencyCode={currencyCode} variant="bodyMedium" />
    </View>
  );
}

function PeriodActions({ period }: { period: BudgetProgressRow }) {
  const { t, formatMonthString } = useI18n();
  const [editing, setEditing] = useState(false);
  const resetMutation = useResetBudgetPeriodMutation();

  return (
    <>
      <RowMenu
        // Named by month as well as category: the same category also owns a row in
        // the list below, whose menu is a different one.
        label={t("budget.period.actionsFor", {
          name: period.categoryName,
          month: formatMonthString(period.periodMonth, "monthYear"),
        })}
        actions={[
          { label: t("budget.period.edit.action"), onPress: () => setEditing(true) },
          ...(period.isOverride && period.budgetId
            ? [
                {
                  label: t("budget.period.reset.action"),
                  disabled: resetMutation.isPending,
                  onPress: () => resetMutation.mutate({ id: period.periodId }),
                },
              ]
            : []),
        ]}
      />

      {editing && (
        <EditBudgetPeriodSheet period={period} open onOpenChange={setEditing} />
      )}
    </>
  );
}
