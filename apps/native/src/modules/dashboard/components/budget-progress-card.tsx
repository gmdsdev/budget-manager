import type { BudgetProgress, BudgetTotals } from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { View } from "react-native";

import { Card, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { BudgetMeter } from "@/modules/budget/components/budget-meter";
import { SPACING } from "@/theme/tokens";

/** How many meters fit before the card stops being scannable. */
const VISIBLE_BUDGETS = 5;

/**
 * The dashboard's read on the budgets: worst-off first, since the point of the widget
 * is what needs acting on. The meters are the budget module's own, so a bar here and a
 * bar on the budget screen cannot drift apart.
 */
export function BudgetProgressCard({
  budgets,
  totals,
  currencyCode,
  monthLabel,
  onOpenBudgets,
}: {
  budgets: BudgetProgress[];
  totals: BudgetTotals | null;
  currencyCode: string;
  monthLabel: string;
  onOpenBudgets: () => void;
}) {
  const t = useTranslate();
  const shown = budgets.slice(0, VISIBLE_BUDGETS);
  const rest = budgets.length - shown.length;

  return (
    <Card>
      <CardHeader
        title={t("dashboard.budgets.title")}
        description={t("dashboard.budgets.description", { month: monthLabel })}
      />

      {shown.length === 0 ? (
        <Text variant="tiny" tone="muted">
          {t("dashboard.budgets.empty")}
        </Text>
      ) : (
        <View style={{ gap: SPACING.lg }}>
          {shown.map((budget) => (
            <BudgetMeter key={budget.periodId} budget={budget} />
          ))}
        </View>
      )}

      <Text variant="tiny" tone="muted" onPress={onOpenBudgets}>
        {totals
          ? t("dashboard.budgets.left", {
              amount: formatMinorUnits(totals.remainingCents, currencyCode),
            })
          : ""}
        {rest > 0 ? ` · ${t("dashboard.budgets.more", { count: rest })}` : ""}
      </Text>
    </Card>
  );
}
