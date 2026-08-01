import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@budget-manager/ui/components/alert-dialog";
import { useTranslate } from "@budget-manager/i18n/react";
import { useDeleteBudgetMutation } from "../mutations/use-budget-mutation";
import type { BudgetRow } from "../types";

export function DeleteBudgetDialog({
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

  function handleDelete() {
    deleteMutation.mutate(
      { id: budget.id },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("budget.delete.title", { name: budget.categoryName })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("budget.delete.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            {deleteMutation.isPending
              ? t("common.deleting")
              : t("budget.delete.submit")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
