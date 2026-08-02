import { todayAsDateString } from "@budget-manager/client";
import {
  useCardPaymentForm,
  useCreateCardPaymentMutation,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { TransactionStatus } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";
import { useResetOnOpen } from "@/hooks/use-reset-on-open";
import {
  CardPaymentFormFields,
} from "@/modules/transaction/components/card-payment-form-fields";

export function CreateCardPaymentSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const createMutation = useCreateCardPaymentMutation();

  const form = useCardPaymentForm({
    defaultValues: {
      status: TransactionStatus.PAID,
      name: "",
      amountCents: 0,
      occurrenceDate: todayAsDateString(),
      creditCardId: "",
      walletId: "",
      creditCardBillId: null,
      notes: null,
    },
    onSubmit: async (values) => {
      await createMutation.mutateAsync(values);
      handleOpenChange(false);
    },
  });

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    form.reset();
  }

  useResetOnOpen(open, form.reset);

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={t("cardPayment.create.title")}
      description={t("cardPayment.create.description")}
      submitLabel={t("cardPayment.create.submit")}
      submittingLabel={t("cardPayment.create.submitting")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <CardPaymentFormFields form={form} />
    </FormSheet>
  );
}
