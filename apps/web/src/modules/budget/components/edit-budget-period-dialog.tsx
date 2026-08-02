import { useI18n } from "@budget-manager/i18n/react";
import { BudgetPeriodFormSchema } from "@budget-manager/schemas";
import { Button } from "@budget-manager/ui/components/button";
import { CurrencyInput } from "@budget-manager/ui/components/currency-input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@budget-manager/ui/components/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@budget-manager/ui/components/field";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useId } from "react";
import { useSetBudgetPeriodAmountMutation } from "@budget-manager/client/react";
import type { BudgetProgressRow } from "@budget-manager/client";

/**
 * One month's limit. Saving marks the month as the user's own, so the series
 * re-laying its schedule no longer overwrites it.
 */
export function EditBudgetPeriodDialog({
  period,
  open,
  onOpenChange,
}: {
  period: BudgetProgressRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, formatMonthString } = useI18n();
  const formId = useId();
  const updateMutation = useSetBudgetPeriodAmountMutation();
  const monthLabel = formatMonthString(period.periodMonth, "monthYear");

  const form = useForm({
    defaultValues: { amountCents: period.limitCents },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync({ id: period.periodId, ...value });
      handleOpenChange(false);
    },
    validationLogic: revalidateLogic({
      mode: "change",
      modeAfterSubmission: "change",
    }),
    validators: { onDynamic: BudgetPeriodFormSchema },
  });

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      form.reset();
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {t("budget.period.edit.title", { month: monthLabel })}
          </DialogTitle>
          <DialogDescription>
            {t("budget.period.edit.description")}
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <FieldGroup>
            <form.Field name="amountCents">
              {(field) => {
                const showErrors =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={showErrors}>
                    <FieldLabel htmlFor={field.name}>
                      {t("budget.column.limit")}
                    </FieldLabel>
                    <CurrencyInput
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      currencyCode={period.currencyCode}
                      onValueChange={field.handleChange}
                      onBlur={field.handleBlur}
                      aria-invalid={showErrors || undefined}
                    />
                    <FieldError
                      errors={showErrors ? field.state.meta.errors : []}
                    />
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline">{t("common.cancel")}</Button>}
          />
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form={formId} disabled={isSubmitting}>
                {isSubmitting ? t("common.saving") : t("common.saveChanges")}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
