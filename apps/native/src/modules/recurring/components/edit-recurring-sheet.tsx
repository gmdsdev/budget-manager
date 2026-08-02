import type { RecurringRow } from "@budget-manager/client";
import {
  useRecurringForm,
  useUpdateRecurringMutation,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";
import {
  RecurringFormFields,
} from "@/modules/recurring/components/recurring-form-fields";

export function EditRecurringSheet({
  series,
  open,
  onOpenChange,
}: {
  series: RecurringRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
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
      onOpenChange(false);
    },
  });

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("recurring.edit.title")}
      description={t("recurring.edit.description")}
      submitLabel={t("common.saveChanges")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <RecurringFormFields form={form} />
    </FormSheet>
  );
}
