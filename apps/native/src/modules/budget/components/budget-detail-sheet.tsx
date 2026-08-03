import { type BudgetRow, repeatsLabel } from "@budget-manager/client";
import { useSetBudgetActiveMutation } from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { useState } from "react";

import { DetailRow, DetailSheet } from "@/components/detail-sheet";
import { Button } from "@/components/ui/button";
import { CategoryLabel } from "@/modules/category/components/category-label";

import { BudgetPeriodsSheet } from "./budget-periods-sheet";
import { DeleteBudgetSheet } from "./delete-budget-sheet";
import { EditBudgetSheet } from "./edit-budget-sheet";

type NestedSheet = "periods" | "edit" | "delete" | null;

/** What a budget row opens: the record in full, with its actions gathered here. */
export function BudgetDetailSheet({
  budget,
  onClose,
}: {
  budget: BudgetRow;
  onClose: () => void;
}) {
  const { t, formatMonthString } = useI18n();
  const [sheet, setSheet] = useState<NestedSheet>(null);
  const setActiveMutation = useSetBudgetActiveMutation();

  /** Dismissing a nested sheet ends the whole interaction, as the row menu did. */
  function closeNested(next: boolean) {
    if (!next) onClose();
  }

  return (
    <>
      <DetailSheet
        open={sheet === null}
        onOpenChange={(next) => {
          if (!next && sheet === null) onClose();
        }}
        title={t("budget.detail.title")}
        description={budget.categoryName}
        amount={formatMinorUnits(budget.amountCents, budget.currencyCode)}
        actions={
          <>
            <Button
              variant="outline"
              label={t("budget.periods.action")}
              onPress={() => setSheet("periods")}
            />
            <Button
              variant="outline"
              label={t("budget.edit.action")}
              onPress={() => setSheet("edit")}
            />
            {/* Reversible from the same place, so it needs no confirmation — and
                it leaves the record open, since the status it just flipped is one
                of the fields above. */}
            <Button
              variant="outline"
              label={
                budget.isActive
                  ? t("budget.pause.action")
                  : t("budget.resume.action")
              }
              disabled={setActiveMutation.isPending}
              onPress={() =>
                setActiveMutation.mutate({
                  id: budget.id,
                  isActive: !budget.isActive,
                })
              }
            />
            <Button
              variant="destructive"
              label={t("budget.delete.submit")}
              onPress={() => setSheet("delete")}
            />
          </>
        }
      >
        <DetailRow label={t("common.category")}>
          <CategoryLabel
            color={budget.categoryColor}
            name={budget.categoryName}
            variant="metaMedium"
          />
        </DetailRow>
        <DetailRow label={t("common.currency")}>
          {budget.currencyCode}
        </DetailRow>
        <DetailRow label={t("budget.column.repeats")}>
          {repeatsLabel(t, budget)}
        </DetailRow>
        <DetailRow label={t("budget.column.startsOn")}>
          {formatMonthString(budget.startsOn, "monthYear")}
        </DetailRow>
        <DetailRow label={t("common.status")}>
          {budget.isActive
            ? t("budget.repeats.active")
            : t("budget.repeats.paused")}
        </DetailRow>
      </DetailSheet>

      {sheet === "periods" && (
        <BudgetPeriodsSheet
          key={budget.id}
          budget={budget}
          open
          onOpenChange={closeNested}
        />
      )}
      {sheet === "edit" && (
        <EditBudgetSheet
          key={budget.id}
          budget={budget}
          open
          onOpenChange={closeNested}
        />
      )}
      {sheet === "delete" && (
        <DeleteBudgetSheet
          key={budget.id}
          budget={budget}
          open
          onOpenChange={closeNested}
        />
      )}
    </>
  );
}
