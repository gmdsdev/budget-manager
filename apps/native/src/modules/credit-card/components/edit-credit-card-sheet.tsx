import type { CreditCardRow } from "@budget-manager/client";
import {
  useCreditCardForm,
  useUpdateCreditCardMutation,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import type { WalletCurrency } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";
import {
  CreditCardFormFields,
} from "@/modules/credit-card/components/credit-card-form-fields";

export function EditCreditCardSheet({
  card,
  open,
  onOpenChange,
}: {
  card: CreditCardRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const updateMutation = useUpdateCreditCardMutation();

  const form = useCreditCardForm({
    defaultValues: {
      name: card.name,
      limitCents: card.limitCents,
      closeDay: card.closeDay,
      dueDay: card.dueDay,
      defaultBillingWalletId: card.defaultBillingWalletId,
      currencyCode: card.currencyCode as WalletCurrency,
    },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ ...values, id: card.id });
      onOpenChange(false);
    },
  });

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("creditCard.edit.title")}
      description={t("creditCard.edit.description", { name: card.name })}
      submitLabel={t("common.saveChanges")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <CreditCardFormFields form={form} />
    </FormSheet>
  );
}
