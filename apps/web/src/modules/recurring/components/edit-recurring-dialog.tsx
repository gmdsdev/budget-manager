import { useTranslate } from "@budget-manager/i18n/react";
import { Button } from "@budget-manager/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@budget-manager/ui/components/dialog";
import { useId } from "react";
import { useRecurringForm } from "@budget-manager/client/react";
import { useUpdateRecurringMutation } from "@budget-manager/client/react";
import type { RecurringRow } from "@budget-manager/client";
import { RecurringFormFields } from "./recurring-form-fields";

export function EditRecurringDialog({
  series,
  open,
  onOpenChange,
}: {
  series: RecurringRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const formId = useId();
  const updateMutation = useUpdateRecurringMutation();

  const form = useRecurringForm({
    defaultValues: {
      kind: series.kind,
      name: series.name,
      amountCents: series.amountCents,
      categoryId: series.categoryId,
      walletId: series.walletId,
      creditCardId: series.creditCardId,
      notes: series.notes,
      recurrenceType: series.recurrenceType,
      interval: series.interval,
      installments: series.installments,
      startsOn: series.startsOn,
    },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ ...values, id: series.id });
      handleOpenChange(false);
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      form.reset();
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("recurring.edit.title")}</DialogTitle>
          <DialogDescription>
            {t("recurring.edit.description")}
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <RecurringFormFields form={form} />
        </form>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline">{t("common.cancel")}</Button>}
          />
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form={formId} disabled={isSubmitting}>
                {isSubmitting ? t("common.saving") : t("common.saveChanges")}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
