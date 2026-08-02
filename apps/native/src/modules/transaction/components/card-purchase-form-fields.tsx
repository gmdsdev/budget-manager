import { TRANSACTION_CATEGORY_NONE } from "@budget-manager/client";
import {
  fieldErrors,
  isFieldInvalid,
  type UseCardPurchaseFormReturnType,
  useCategoryOptionsQuery,
  useCreditCardOptionsQuery,
  useEnumLabels,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { CategoryType, TransactionStatus } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldGroup, FieldRow } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCategoryItems } from "@/modules/category/components/category-items";

export function CardPurchaseFormFields({
  form,
}: {
  form: UseCardPurchaseFormReturnType;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const creditCardId = useSelector(form.store, (state) => state.values.creditCardId);

  const { data: cards, isPending: cardsPending } = useCreditCardOptionsQuery();
  // Buying on a card is spending, so only expense categories apply.
  const { data: categories, isPending: categoriesPending } = useCategoryOptionsQuery(
    CategoryType.EXPENSE,
  );

  const cardItems = (cards ?? []).map((card) => ({
    label: `${card.name} (${card.currencyCode})`,
    value: card.id,
  }));

  const statusItems = Object.values(TransactionStatus).map((status) => ({
    label: labels.transactionStatus(status),
    value: status,
  }));

  const categoryOptions = useCategoryItems(categories);

  const currencyCode =
    cards?.find((card) => card.id === creditCardId)?.currencyCode ?? "BRL";

  return (
    <FieldGroup>
      <form.Field name="name">
        {(field) => (
          <Field label={t("common.description")} errors={fieldErrors(field)}>
            <Input
              value={field.state.value}
              invalid={isFieldInvalid(field)}
              accessibilityLabel={t("common.description")}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
            />
          </Field>
        )}
      </form.Field>

      <FieldRow>
        <form.Field name="amountCents">
          {(field) => (
            <Field
              label={t("common.amount")}
              // A card purchase is the expense; nothing leaves a wallet yet.
              description={t("transaction.field.cardPurchaseAmountHint")}
              errors={fieldErrors(field)}
            >
              <CurrencyInput
                value={field.state.value}
                currencyCode={currencyCode}
                invalid={isFieldInvalid(field)}
                accessibilityLabel={t("common.amount")}
                onValueChange={field.handleChange}
                onBlur={field.handleBlur}
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="occurrenceDate">
          {(field) => (
            <Field label={t("common.date")} errors={fieldErrors(field)}>
              <DatePicker
                label={t("common.date")}
                value={field.state.value}
                invalid={isFieldInvalid(field)}
                onValueChange={field.handleChange}
              />
            </Field>
          )}
        </form.Field>
      </FieldRow>

      <form.Field name="creditCardId">
        {(field) => (
          <Field label={t("common.card")} errors={fieldErrors(field)}>
            <Select
              label={t("common.card")}
              items={cardItems}
              value={field.state.value}
              placeholder={t("transaction.field.selectACard")}
              disabled={cardsPending || cardItems.length === 0}
              invalid={isFieldInvalid(field)}
              onValueChange={field.handleChange}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="categoryId">
        {(field) => (
          <Field label={t("common.category")} errors={fieldErrors(field)}>
            <Select
              label={t("common.category")}
              items={categoryOptions}
              value={field.state.value ?? TRANSACTION_CATEGORY_NONE}
              disabled={categoriesPending}
              invalid={isFieldInvalid(field)}
              onValueChange={(value) =>
                field.handleChange(
                  value === TRANSACTION_CATEGORY_NONE || !value ? null : value,
                )
              }
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="status">
        {(field) => (
          <Field label={t("common.status")} errors={fieldErrors(field)}>
            <Select
              label={t("common.status")}
              items={statusItems}
              value={field.state.value}
              invalid={isFieldInvalid(field)}
              onValueChange={(value) => field.handleChange(value as TransactionStatus)}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="notes">
        {(field) => (
          <Field label={t("common.notes")} errors={fieldErrors(field)}>
            <Textarea
              value={field.state.value ?? ""}
              invalid={isFieldInvalid(field)}
              accessibilityLabel={t("common.notes")}
              onBlur={field.handleBlur}
              onChangeText={(text) => field.handleChange(text || null)}
            />
          </Field>
        )}
      </form.Field>
    </FieldGroup>
  );
}
