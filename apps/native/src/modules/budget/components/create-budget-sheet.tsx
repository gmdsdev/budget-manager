import { currentMonth } from "@budget-manager/client";
import {
  useBudgetForm,
  useCreateBudgetMutation,
  usePreferredCurrency,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { RecurrenceType } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";
import { useResetOnOpen } from "@/hooks/use-reset-on-open";
import { BudgetFormFields } from "@/modules/budget/components/budget-form-fields";

export function CreateBudgetSheet({
  month,
  open,
  onOpenChange,
}: {
  /** The month in view, so a limit lands where the user is looking. */
  month?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const createMutation = useCreateBudgetMutation();
  const preferredCurrency = usePreferredCurrency();

  const form = useBudgetForm({
    defaultValues: {
      categoryId: "",
      currencyCode: preferredCurrency,
      amountCents: 0,
      recurrenceType: RecurrenceType.MONTHLY,
      interval: 1,
      installments: null,
      startsOn: month ?? currentMonth(),
    },
    onSubmit: async (values) => {
      await createMutation.mutateAsync(values);
      handleOpenChange(false);
    },
  });

  // Reset on open as well as close: the preferred currency and the month in view are
  // read from outside the form, and either can change while it is shut.
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
      title={t("budget.create.title")}
      description={t("budget.create.description")}
      submitLabel={t("budget.create.submit")}
      submittingLabel={t("common.creating")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <BudgetFormFields form={form} />
    </FormSheet>
  );
}
