import { todayAsDateString } from "@budget-manager/client";
import {
  useCardPurchaseForm,
  useCreateCardPurchaseMutation,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { TransactionStatus } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";
import { useResetOnOpen } from "@/hooks/use-reset-on-open";
import {
  CardPurchaseFormFields,
} from "@/modules/transaction/components/card-purchase-form-fields";

export function CreateCardPurchaseSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const createMutation = useCreateCardPurchaseMutation();

  const form = useCardPurchaseForm({
    defaultValues: {
      status: TransactionStatus.PAID,
      name: "",
      amountCents: 0,
      occurrenceDate: todayAsDateString(),
      creditCardId: "",
      categoryId: null,
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
      title={t("cardPurchase.create.title")}
      description={t("cardPurchase.create.description")}
      submitLabel={t("cardPurchase.create.submit")}
      submittingLabel={t("cardPurchase.create.submitting")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <CardPurchaseFormFields form={form} />
    </FormSheet>
  );
}
