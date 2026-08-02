import { type BudgetRow } from "@budget-manager/client";
import { useDeleteBudgetMutation } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";

import { ConfirmSheet } from "@/components/ui/confirm-sheet";

export function DeleteBudgetSheet({
  budget,
  open,
  onOpenChange,
}: {
  budget: BudgetRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const deleteMutation = useDeleteBudgetMutation();

  return (
    <ConfirmSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("budget.delete.title", { name: budget.categoryName })}
      description={t("budget.delete.description")}
      confirmLabel={t("budget.delete.submit")}
      isPending={deleteMutation.isPending}
      onConfirm={() =>
        deleteMutation.mutate(
          { id: budget.id },
          { onSuccess: () => onOpenChange(false) },
        )
      }
    />
  );
}
