import type { RecurringRow } from "@budget-manager/client";
import { useDeleteRecurringMutation } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";

import { ConfirmSheet } from "@/components/ui/confirm-sheet";

/**
 * Confirmed like every other destructive action: deleting a series drops the rule
 * and every occurrence it laid down that has not happened yet, across months, and
 * none of that is recoverable.
 */
export function DeleteRecurringSheet({
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

  return (
    <ConfirmSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("recurring.delete.title", { name: series.name })}
      description={t("recurring.delete.description")}
      confirmLabel={t("recurring.delete.submit")}
      isPending={deleteMutation.isPending}
      onConfirm={() =>
        deleteMutation.mutate(
          { id: series.id },
          { onSuccess: () => onOpenChange(false) },
        )
      }
    />
  );
}
