import {
  useCreateCreditCardMutation,
  useCreditCardForm,
  usePreferredCurrency,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";
import { useResetOnOpen } from "@/hooks/use-reset-on-open";
import {
  CreditCardFormFields,
} from "@/modules/credit-card/components/credit-card-form-fields";

const DEFAULT_CLOSE_DAY = 20;
const DEFAULT_DUE_DAY = 28;

export function CreateCreditCardSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const createMutation = useCreateCreditCardMutation();
  const preferredCurrency = usePreferredCurrency();

  const form = useCreditCardForm({
    defaultValues: {
      name: "",
      limitCents: 0,
      closeDay: DEFAULT_CLOSE_DAY,
      dueDay: DEFAULT_DUE_DAY,
      defaultBillingWalletId: null,
      currencyCode: preferredCurrency,
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
      title={t("creditCard.create.title")}
      description={t("creditCard.create.description")}
      submitLabel={t("creditCard.create.submit")}
      submittingLabel={t("common.creating")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <CreditCardFormFields form={form} />
    </FormSheet>
  );
}
