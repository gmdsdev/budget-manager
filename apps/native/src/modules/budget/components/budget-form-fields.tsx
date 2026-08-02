import {
  fieldErrors,
  isFieldInvalid,
  type UseBudgetFormReturnType,
  useCategoryOptionsQuery,
  useEnumLabels,
} from "@budget-manager/client/react";
import type { MessageKey } from "@budget-manager/i18n";
import { useTranslate } from "@budget-manager/i18n/react";
import {
  BUDGET_RECURRENCE_TYPES,
  type BudgetRecurrenceType,
  CategoryType,
  RECURRENCE_YEARS,
  RecurrenceType,
  WalletCurrency,
} from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/ui/month-picker";
import { Select } from "@/components/ui/select";
import { useColors } from "@/theme/theme-provider";

const INTERVAL_UNIT = {
  [RecurrenceType.FIXED]: "recurring.unit.months",
  [RecurrenceType.MONTHLY]: "recurring.unit.months",
  [RecurrenceType.YEARLY]: "recurring.unit.years",
} as const satisfies Record<BudgetRecurrenceType, MessageKey>;

export function BudgetFormFields({
  form,
  /** The category cannot move once months exist under the old one. */
  lockCategory = false,
}: {
  form: UseBudgetFormReturnType;
  lockCategory?: boolean;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const colors = useColors();

  const currencyCode = useSelector(form.store, (state) => state.values.currencyCode);
  const recurrenceType = useSelector(form.store, (state) => state.values.recurrenceType);

  // Only expense categories can carry a limit, so the picker never offers one the
  // server would reject.
  const { data: categories, isPending: categoriesPending } = useCategoryOptionsQuery(
    CategoryType.EXPENSE,
  );

  const categoryItems = (categories ?? []).map((category) => ({
    label: category.name,
    value: category.id,
    color: colors.category[category.color],
  }));

  const currencyItems = Object.values(WalletCurrency).map((value) => ({
    label: labels.currency(value),
    value,
  }));

  const recurrenceItems = BUDGET_RECURRENCE_TYPES.map((type) => ({
    label: labels.recurrenceType(type),
    value: type,
  }));

  const isFixed = recurrenceType === RecurrenceType.FIXED;

  return (
    <FieldGroup>
      <form.Field name="categoryId">
        {(field) => (
          <Field
            label={t("budget.field.category")}
            description={t("budget.field.categoryHint")}
            errors={fieldErrors(field)}
          >
            <Select
              label={t("budget.field.category")}
              items={categoryItems}
              value={field.state.value}
              placeholder={t("budget.selectACategory")}
              disabled={lockCategory || categoriesPending || categoryItems.length === 0}
              invalid={isFieldInvalid(field)}
              onValueChange={field.handleChange}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="currencyCode">
        {(field) => (
          <Field label={t("common.currency")} errors={fieldErrors(field)}>
            <Select
              label={t("common.currency")}
              items={currencyItems}
              value={field.state.value}
              invalid={isFieldInvalid(field)}
              onValueChange={(value) => field.handleChange(value as WalletCurrency)}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="amountCents">
        {(field) => (
          <Field
            label={t("budget.field.limit")}
            description={t("budget.field.limitHint")}
            errors={fieldErrors(field)}
          >
            <CurrencyInput
              value={field.state.value}
              currencyCode={currencyCode}
              invalid={isFieldInvalid(field)}
              accessibilityLabel={t("budget.field.limit")}
              onValueChange={field.handleChange}
              onBlur={field.handleBlur}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="recurrenceType">
        {(field) => (
          <Field
            label={t("budget.field.repeats")}
            description={
              isFixed
                ? t("budget.field.fixedHint")
                : t("budget.field.openEndedHint", { years: RECURRENCE_YEARS })
            }
            errors={fieldErrors(field)}
          >
            <Select
              label={t("budget.field.repeats")}
              items={recurrenceItems}
              value={field.state.value}
              invalid={isFieldInvalid(field)}
              onValueChange={(value) => {
                const next = value as BudgetRecurrenceType;

                field.handleChange(next);

                // Only a fixed budget carries a count.
                if (next !== RecurrenceType.FIXED) {
                  form.setFieldValue("installments", null);
                }
              }}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="interval">
        {(field) => (
          <Field
            label={t("budget.field.every")}
            description={t("budget.field.intervalHint", {
              unit: t(INTERVAL_UNIT[recurrenceType]),
            })}
            errors={fieldErrors(field)}
          >
            <Input
              keyboardType="number-pad"
              value={`${field.state.value}`}
              invalid={isFieldInvalid(field)}
              accessibilityLabel={t("budget.field.every")}
              onBlur={field.handleBlur}
              onChangeText={(text) => field.handleChange(Number(text || 0))}
            />
          </Field>
        )}
      </form.Field>

      {isFixed && (
        <form.Field name="installments">
          {(field) => (
            <Field label={t("budget.field.periods")} errors={fieldErrors(field)}>
              <Input
                keyboardType="number-pad"
                value={field.state.value === null ? "" : `${field.state.value}`}
                invalid={isFieldInvalid(field)}
                accessibilityLabel={t("budget.field.periods")}
                onBlur={field.handleBlur}
                onChangeText={(text) => field.handleChange(text ? Number(text) : null)}
              />
            </Field>
          )}
        </form.Field>
      )}

      <form.Field name="startsOn">
        {(field) => (
          <Field
            label={t("budget.field.startsOn")}
            description={t("budget.field.startsOnHint")}
            errors={fieldErrors(field)}
          >
            <MonthPicker
              value={field.state.value}
              invalid={isFieldInvalid(field)}
              onValueChange={field.handleChange}
            />
          </Field>
        )}
      </form.Field>
    </FieldGroup>
  );
}
