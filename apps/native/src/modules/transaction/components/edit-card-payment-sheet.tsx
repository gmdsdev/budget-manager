import type { TransactionRow } from "@budget-manager/client";
import {
  useCardPaymentForm,
  useUpdateCardPaymentMutation,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";
import {
  CardPaymentFormFields,
} from "@/modules/transaction/components/card-payment-form-fields";

export function EditCardPaymentSheet({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: TransactionRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const updateMutation = useUpdateCardPaymentMutation();

  const form = useCardPaymentForm({
    defaultValues: {
      status: transaction.status,
      name: transaction.name,
      amountCents: transaction.amountCents,
      occurrenceDate: transaction.occurrenceDate,
      creditCardId: transaction.creditCardId ?? "",
      walletId: transaction.walletId ?? "",
      creditCardBillId: transaction.creditCardBillId,
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
      title={t("cardPayment.edit.title")}
      description={t("cardPayment.edit.description", { name: transaction.name })}
      submitLabel={t("common.saveChanges")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <CardPaymentFormFields form={form} />
    </FormSheet>
  );
}
