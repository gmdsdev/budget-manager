import { DetailRow, DetailSheet } from "@/components/detail-sheet";
import { CategoryLabel } from "@/modules/category/components/category-dot";
import { repeatsLabel, type BudgetRow } from "@budget-manager/client";
import { useSetBudgetActiveMutation } from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { Button } from "@budget-manager/ui/components/button";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { useState } from "react";

import { BudgetPeriodsDialog } from "./budget-periods-dialog";
import { DeleteBudgetDialog } from "./delete-budget-dialog";
import { EditBudgetDialog } from "./edit-budget-dialog";

type NestedDialog = "periods" | "edit" | "delete" | null;

/** What a budget row opens: the record in full, with its actions gathered here. */
export function BudgetDetailDialog({
  budget,
  onClose,
}: {
  budget: BudgetRow;
  onClose: () => void;
}) {
  const { t, formatMonthString } = useI18n();
  const [dialog, setDialog] = useState<NestedDialog>(null);
  const setActiveMutation = useSetBudgetActiveMutation();

  /** Dismissing a nested dialog ends the whole interaction, as the old row menu did. */
  function closeNested(next: boolean) {
    if (!next) onClose();
  }

  return (
    <>
      <DetailSheet
        open={dialog === null}
        onOpenChange={(next) => {
          if (!next && dialog === null) onClose();
        }}
        title={t("budget.detail.title")}
        description={budget.categoryName}
        amount={formatMinorUnits(budget.amountCents, budget.currencyCode)}
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog("periods")}>
              {t("budget.periods.action")}
            </Button>
            <Button variant="outline" onClick={() => setDialog("edit")}>
              {t("budget.edit.action")}
            </Button>
            {/* Reversible from the same place, so it needs no confirmation — and
                it leaves the record open, since the status it just flipped is
                one of the fields above. */}
            <Button
              variant="outline"
              disabled={setActiveMutation.isPending}
              onClick={() =>
                setActiveMutation.mutate({
                  id: budget.id,
                  isActive: !budget.isActive,
                })
              }
            >
              {budget.isActive
                ? t("budget.pause.action")
                : t("budget.resume.action")}
            </Button>
            <Button variant="destructive" onClick={() => setDialog("delete")}>
              {t("budget.delete.submit")}
            </Button>
          </>
        }
      >
        <DetailRow label={t("common.category")}>
          <CategoryLabel
            color={budget.categoryColor}
            name={budget.categoryName}
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

      {dialog === "periods" && (
        <BudgetPeriodsDialog
          key={budget.id}
          budget={budget}
          open
          onOpenChange={closeNested}
        />
      )}
      {dialog === "edit" && (
        <EditBudgetDialog
          key={budget.id}
          budget={budget}
          open
          onOpenChange={closeNested}
        />
      )}
      {dialog === "delete" && (
        <DeleteBudgetDialog
          key={budget.id}
          budget={budget}
          open
          onOpenChange={closeNested}
        />
      )}
    </>
  );
}
