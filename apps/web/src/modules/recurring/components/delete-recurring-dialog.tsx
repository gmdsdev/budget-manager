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
import { useDeleteRecurringMutation } from "../mutations/use-recurring-mutation";
import type { RecurringRow } from "../types";

export function DeleteRecurringDialog({
  series,
  open,
  onOpenChange,
}: {
  series: RecurringRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const deleteMutation = useDeleteRecurringMutation();

  function handleDelete() {
    deleteMutation.mutate(
      { id: series.id },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("recurring.delete.title", { name: series.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("recurring.delete.description")}
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
              : t("recurring.delete.submit")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
