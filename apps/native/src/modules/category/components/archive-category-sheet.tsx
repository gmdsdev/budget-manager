import type { CategoryRow } from "@budget-manager/client";
import {
  useArchiveCategoryMutation,
  useEnumLabels,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";

import { ConfirmSheet } from "@/components/ui/confirm-sheet";

export function ArchiveCategorySheet({
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

  return (
    <ConfirmSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("category.archive.title", { name: category.name })}
      description={t("category.archive.description", {
        type: labels.categoryType(category.type).toLowerCase(),
      })}
      confirmLabel={t("category.archive.submit")}
      pendingLabel={t("category.archive.submitting")}
      isPending={archiveMutation.isPending}
      onConfirm={() =>
        archiveMutation.mutate(
          { id: category.id },
          { onSuccess: () => onOpenChange(false) },
        )
      }
    />
  );
}
