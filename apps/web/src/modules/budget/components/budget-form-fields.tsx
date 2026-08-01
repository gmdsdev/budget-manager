import {
  CategoryItemLabel,
  CategoryLabel,
  type CategoryItem,
} from "@/modules/category/components/category-dot";
import { useCategoryOptionsQuery } from "@/modules/category/queries/use-category-options-query";
import { useEnumLabels } from "@/lib/enum-labels";
import type { MessageKey } from "@budget-manager/i18n";
import { useTranslate } from "@budget-manager/i18n/react";
import {
  BUDGET_RECURRENCE_TYPES,
  CategoryType,
  RECURRENCE_YEARS,
  RecurrenceType,
  WalletCurrency,
  type BudgetRecurrenceType,
} from "@budget-manager/schemas";
import { CurrencyInput } from "@budget-manager/ui/components/currency-input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@budget-manager/ui/components/field";
import { Input } from "@budget-manager/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@budget-manager/ui/components/select";
import { useSelector } from "@tanstack/react-form";
import type { UseBudgetFormReturnType } from "../hooks/use-budget-form";
import { MonthPicker } from "./month-picker";

const INTERVAL_UNIT = {
  [RecurrenceType.FIXED]: "recurring.unit.months",
  [RecurrenceType.MONTHLY]: "recurring.unit.months",
  [RecurrenceType.YEARLY]: "recurring.unit.years",
} as const satisfies Record<BudgetRecurrenceType, MessageKey>;

function invalid(field: {
  state: { meta: { isTouched: boolean; isValid: boolean } };
}) {
  return field.state.meta.isTouched && !field.state.meta.isValid;
}

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
  const currencyCode = useSelector(
    form.store,
    (state) => state.values.currencyCode,
  );
  const recurrenceType = useSelector(
    form.store,
    (state) => state.values.recurrenceType,
  );

  // Only expense categories can carry a limit, so the picker never offers one
  // the server would reject.
  const { data: categories, isPending: categoriesPending } =
    useCategoryOptionsQuery(CategoryType.EXPENSE);

  const categoryItems: CategoryItem[] = (categories ?? []).map((category) => ({
    label: category.name,
    value: category.id,
    color: category.color,
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
        {(field) => {
          const showErrors = invalid(field);

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>
                {t("budget.field.category")}
              </FieldLabel>
              <Select<string>
                items={categoryItems}
                id={field.name}
                name={field.name}
                value={field.state.value}
                disabled={
                  lockCategory ||
                  categoriesPending ||
                  categoryItems.length === 0
                }
                onValueChange={(value) => field.handleChange(value ?? "")}
              >
                <SelectTrigger aria-invalid={showErrors || undefined}>
                  <SelectValue placeholder={t("budget.selectACategory")}>
                    {(selected: string) => (
                      <CategoryItemLabel
                        items={categoryItems}
                        value={selected}
                      />
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categoryItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <CategoryLabel color={item.color} name={item.label} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {t("budget.field.categoryHint")}
              </FieldDescription>
              <FieldError errors={showErrors ? field.state.meta.errors : []} />
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="currencyCode">
        {(field) => {
          const showErrors = invalid(field);

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>
                {t("common.currency")}
              </FieldLabel>
              <Select
                items={currencyItems}
                id={field.name}
                name={field.name}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as WalletCurrency)
                }
              >
                <SelectTrigger aria-invalid={showErrors || undefined}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={showErrors ? field.state.meta.errors : []} />
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="amountCents">
        {(field) => {
          const showErrors = invalid(field);

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>
                {t("budget.field.limit")}
              </FieldLabel>
              <CurrencyInput
                id={field.name}
                name={field.name}
                value={field.state.value}
                currencyCode={currencyCode}
                onValueChange={field.handleChange}
                onBlur={field.handleBlur}
                aria-invalid={showErrors || undefined}
              />
              <FieldDescription>{t("budget.field.limitHint")}</FieldDescription>
              <FieldError errors={showErrors ? field.state.meta.errors : []} />
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="recurrenceType">
        {(field) => {
          const showErrors = invalid(field);

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>
                {t("budget.field.repeats")}
              </FieldLabel>
              <Select
                items={recurrenceItems}
                id={field.name}
                name={field.name}
                value={field.state.value}
                onValueChange={(value) => {
                  const next = value as BudgetRecurrenceType;

                  field.handleChange(next);

                  // Only a fixed budget carries a count.
                  if (next !== RecurrenceType.FIXED) {
                    form.setFieldValue("installments", null);
                  }
                }}
              >
                <SelectTrigger aria-invalid={showErrors || undefined}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recurrenceItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {isFixed
                  ? t("budget.field.fixedHint")
                  : t("budget.field.openEndedHint", {
                      years: RECURRENCE_YEARS,
                    })}
              </FieldDescription>
              <FieldError errors={showErrors ? field.state.meta.errors : []} />
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="interval">
        {(field) => {
          const showErrors = invalid(field);

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>
                {t("budget.field.every")}
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="number"
                min={1}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(Number(event.target.value))
                }
                aria-invalid={showErrors || undefined}
              />
              <FieldDescription>
                {t("budget.field.intervalHint", {
                  unit: t(INTERVAL_UNIT[recurrenceType]),
                })}
              </FieldDescription>
              <FieldError errors={showErrors ? field.state.meta.errors : []} />
            </Field>
          );
        }}
      </form.Field>

      {isFixed && (
        <form.Field name="installments">
          {(field) => {
            const showErrors = invalid(field);

            return (
              <Field data-invalid={showErrors}>
                <FieldLabel htmlFor={field.name}>
                  {t("budget.field.periods")}
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  min={1}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                  aria-invalid={showErrors || undefined}
                />
                <FieldError
                  errors={showErrors ? field.state.meta.errors : []}
                />
              </Field>
            );
          }}
        </form.Field>
      )}

      <form.Field name="startsOn">
        {(field) => {
          const showErrors = invalid(field);

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>
                {t("budget.field.startsOn")}
              </FieldLabel>
              <MonthPicker
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onValueChange={field.handleChange}
                aria-invalid={showErrors || undefined}
              />
              <FieldDescription>
                {t("budget.field.startsOnHint")}
              </FieldDescription>
              <FieldError errors={showErrors ? field.state.meta.errors : []} />
            </Field>
          );
        }}
      </form.Field>
    </FieldGroup>
  );
}
