import { useEnumLabels } from "@/lib/enum-labels";
import { useTranslate } from "@budget-manager/i18n/react";
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
  const t = useTranslate();
  const labels = useEnumLabels();
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
          <AlertDialogTitle>
            {t("category.archive.title", { name: category.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("category.archive.description", {
              type: labels.categoryType(category.type).toLowerCase(),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={archiveMutation.isPending}
            onClick={handleArchive}
          >
            {archiveMutation.isPending
              ? t("category.archive.submitting")
              : t("category.archive.submit")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
