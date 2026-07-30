import { CategoryTypeLabelMap } from "@budget-manager/schemas";
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
import { useArchiveCategoryMutation } from "../mutations/use-category-mutation";
import type { CategoryRow } from "../types";

export function ArchiveCategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  category: CategoryRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const archiveMutation = useArchiveCategoryMutation();

  function handleArchive() {
    archiveMutation.mutate(
      { id: category.id },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive “{category.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This {CategoryTypeLabelMap[category.type].toLowerCase()} category
            will be hidden from your list. Transactions already using it keep
            their category, and you can restore it later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={archiveMutation.isPending}
            onClick={handleArchive}
          >
            {archiveMutation.isPending ? "Archiving…" : "Archive category"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
