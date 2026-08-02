import { type BudgetRow } from "@budget-manager/client";
import { useBudgetForm, useUpdateBudgetMutation } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { type WalletCurrency } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";
import { BudgetFormFields } from "@/modules/budget/components/budget-form-fields";

export function EditBudgetSheet({
  budget,
  open,
  onOpenChange,
}: {
  budget: BudgetRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const updateMutation = useUpdateBudgetMutation();

  const form = useBudgetForm({
    defaultValues: {
      categoryId: budget.categoryId,
      currencyCode: budget.currencyCode as WalletCurrency,
      amountCents: budget.amountCents,
      recurrenceType: budget.recurrenceType,
      interval: budget.interval,
      installments: budget.installments,
      startsOn: budget.startsOn,
    },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ ...values, id: budget.id });
      onOpenChange(false);
    },
  });

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("budget.edit.title")}
      description={t("budget.edit.description")}
      submitLabel={t("common.saveChanges")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <BudgetFormFields form={form} />
    </FormSheet>
  );
}
