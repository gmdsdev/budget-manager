import type { TransactionRow } from "@budget-manager/client";
import {
  useCardPurchaseForm,
  useUpdateCardPurchaseMutation,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";
import {
  CardPurchaseFormFields,
} from "@/modules/transaction/components/card-purchase-form-fields";

export function EditCardPurchaseSheet({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: TransactionRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const updateMutation = useUpdateCardPurchaseMutation();

  const form = useCardPurchaseForm({
    defaultValues: {
      status: transaction.status,
      name: transaction.name,
      amountCents: transaction.amountCents,
      occurrenceDate: transaction.occurrenceDate,
      creditCardId: transaction.creditCardId ?? "",
      categoryId: transaction.categoryId,
      notes: transaction.notes,
    },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ ...values, id: transaction.id });
      onOpenChange(false);
    },
  });

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("cardPurchase.edit.title")}
      description={t("cardPurchase.edit.description", { name: transaction.name })}
      submitLabel={t("common.saveChanges")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <CardPurchaseFormFields form={form} />
    </FormSheet>
  );
}
