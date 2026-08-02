import { type BudgetRow, repeatsLabel } from "@budget-manager/client";
import { useSetBudgetActiveMutation } from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { useState } from "react";

import { Amount } from "@/components/amount";
import { RowCard } from "@/components/ui/row-card";
import { RowMenu } from "@/components/ui/row-menu";
import { BudgetPeriodsSheet } from "@/modules/budget/components/budget-periods-sheet";
import { DeleteBudgetSheet } from "@/modules/budget/components/delete-budget-sheet";
import { EditBudgetSheet } from "@/modules/budget/components/edit-budget-sheet";
import { CategoryLabel } from "@/modules/category/components/category-label";

type RowSheet = "edit" | "periods" | "delete" | null;

export function BudgetRowCard({ budget }: { budget: BudgetRow }) {
  const { t, formatMonthString } = useI18n();
  const [sheet, setSheet] = useState<RowSheet>(null);
  const setActiveMutation = useSetBudgetActiveMutation();

  return (
    <>
      <RowCard
        primary={
          <CategoryLabel
            color={budget.categoryColor}
            name={budget.categoryName}
            variant="bodyMedium"
          />
        }
        trailing={
          <Amount cents={budget.amountCents} currencyCode={budget.currencyCode} />
        }
        actions={
          <RowMenu
            label={t("common.actionsFor", { name: budget.categoryName })}
            actions={[
              { label: t("budget.periods.action"), onPress: () => setSheet("periods") },
              { label: t("budget.edit.action"), onPress: () => setSheet("edit") },
              {
                label: budget.isActive
                  ? t("budget.pause.action")
                  : t("budget.resume.action"),
                disabled: setActiveMutation.isPending,
                onPress: () =>
                  setActiveMutation.mutate({
                    id: budget.id,
                    isActive: !budget.isActive,
                  }),
              },
              {
                label: t("budget.delete.submit"),
                destructive: true,
                onPress: () => setSheet("delete"),
              },
            ]}
          />
        }
        details={[
          { label: t("common.currency"), value: budget.currencyCode },
          { label: t("budget.column.repeats"), value: repeatsLabel(t, budget) },
          {
            label: t("budget.column.startsOn"),
            value: formatMonthString(budget.startsOn, "monthYear"),
          },
          {
            label: t("common.status"),
            value: budget.isActive
              ? t("budget.repeats.active")
              : t("budget.repeats.paused"),
          },
        ]}
      />

      {sheet === "periods" && (
        <BudgetPeriodsSheet
          budget={budget}
          open
          onOpenChange={(next) => setSheet(next ? "periods" : null)}
        />
      )}
      {sheet === "edit" && (
        <EditBudgetSheet
          budget={budget}
          open
          onOpenChange={(next) => setSheet(next ? "edit" : null)}
        />
      )}
      {sheet === "delete" && (
        <DeleteBudgetSheet
          budget={budget}
          open
          onOpenChange={(next) => setSheet(next ? "delete" : null)}
        />
      )}
    </>
  );
}
