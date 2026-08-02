import { type BudgetProgressRow } from "@budget-manager/client";
import {
  fieldErrors,
  isFieldInvalid,
  useBudgetPeriodForm,
  useSetBudgetPeriodAmountMutation,
} from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { useSelector } from "@tanstack/react-form";

import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormSheet } from "@/components/ui/form-sheet";

/**
 * One month's limit. Saving marks the month as the user's own, so the series
 * re-laying its schedule no longer overwrites it — `is_override` is the whole
 * editing model.
 */
export function EditBudgetPeriodSheet({
  period,
  open,
  onOpenChange,
}: {
  period: BudgetProgressRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, formatMonthString } = useI18n();
  const updateMutation = useSetBudgetPeriodAmountMutation();

  const form = useBudgetPeriodForm({
    defaultValues: { amountCents: period.limitCents },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ id: period.periodId, ...values });
      onOpenChange(false);
    },
  });

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("budget.period.edit.title", {
        month: formatMonthString(period.periodMonth, "monthYear"),
      })}
      description={t("budget.period.edit.description")}
      submitLabel={t("common.saveChanges")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <FieldGroup>
        <form.Field name="amountCents">
          {(field) => (
            <Field label={t("budget.field.limit")} errors={fieldErrors(field)}>
              <CurrencyInput
                value={field.state.value}
                currencyCode={period.currencyCode}
                invalid={isFieldInvalid(field)}
                accessibilityLabel={t("budget.field.limit")}
                onValueChange={field.handleChange}
                onBlur={field.handleBlur}
              />
            </Field>
          )}
        </form.Field>
      </FieldGroup>
    </FormSheet>
  );
}
