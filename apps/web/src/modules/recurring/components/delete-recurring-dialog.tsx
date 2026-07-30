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
          <AlertDialogTitle>Delete “{series.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Scheduled transactions still ahead of today are removed. Anything
            already settled or in the past stays in your history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete series"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
