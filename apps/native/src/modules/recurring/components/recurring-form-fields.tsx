import { TRANSACTION_CATEGORY_NONE } from "@budget-manager/client";
import {
  fieldErrors,
  isFieldInvalid,
  useCategoryOptionsQuery,
  useCreditCardOptionsQuery,
  useEnumLabels,
  type UseRecurringFormReturnType,
  useWalletOptionsQuery,
} from "@budget-manager/client/react";
import type { MessageKey } from "@budget-manager/i18n";
import { useTranslate } from "@budget-manager/i18n/react";
import {
  CategoryType,
  RECURRENCE_YEARS,
  RecurrenceType,
  RECURRING_KINDS,
  type RecurringKind,
  TransactionKind,
} from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCategoryItems } from "@/modules/category/components/category-items";

const INTERVAL_UNIT = {
  [RecurrenceType.FIXED]: "recurring.unit.months",
  [RecurrenceType.WEEKLY]: "recurring.unit.weeks",
  [RecurrenceType.MONTHLY]: "recurring.unit.months",
  [RecurrenceType.YEARLY]: "recurring.unit.years",
} as const satisfies Record<RecurrenceType, MessageKey>;

export function RecurringFormFields({
  form,
}: {
  form: UseRecurringFormReturnType;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();

  const kind = useSelector(form.store, (state) => state.values.kind);
  const recurrenceType = useSelector(form.store, (state) => state.values.recurrenceType);
  const walletId = useSelector(form.store, (state) => state.values.walletId);
  const creditCardId = useSelector(form.store, (state) => state.values.creditCardId);

  const isCardPurchase = kind === TransactionKind.CREDIT_CARD_PURCHASE;
  const isFixed = recurrenceType === RecurrenceType.FIXED;

  const { data: wallets, isPending: walletsPending } = useWalletOptionsQuery();
  const { data: cards, isPending: cardsPending } = useCreditCardOptionsQuery();
  const { data: categories, isPending: categoriesPending } = useCategoryOptionsQuery(
    kind === TransactionKind.INCOME ? CategoryType.INCOME : CategoryType.EXPENSE,
  );

  const kindItems = RECURRING_KINDS.map((value) => ({
    label: labels.transactionKind(value),
    value,
  }));

  const recurrenceItems = Object.values(RecurrenceType).map((type) => ({
    label: labels.recurrenceType(type),
    value: type,
  }));

  // A card purchase bills a card; income and expenses move a wallet.
  const accountItems = isCardPurchase
    ? (cards ?? []).map((card) => ({
        label: `${card.name} (${card.currencyCode})`,
        value: card.id,
      }))
    : (wallets ?? []).map((wallet) => ({
        label: `${wallet.name} (${wallet.currencyCode})`,
        value: wallet.id,
      }));

  const currencyCode = isCardPurchase
    ? (cards?.find((card) => card.id === creditCardId)?.currencyCode ?? "BRL")
    : (wallets?.find((wallet) => wallet.id === walletId)?.currencyCode ?? "BRL");

  const categoryOptions = useCategoryItems(categories);

  return (
    <FieldGroup>
      <form.Field name="kind">
        {(field) => (
          <Field label={t("recurring.field.kind")} errors={fieldErrors(field)}>
            <Select
              label={t("recurring.field.kind")}
              items={kindItems}
              value={field.state.value}
              invalid={isFieldInvalid(field)}
              onValueChange={(value) => {
                field.handleChange(value as RecurringKind);
                // The account and category lists both change with the kind, and
                // the old values stay legal options — the picker cannot see that
                // only their meaning changed.
                form.setFieldValue("walletId", null);
                form.setFieldValue("creditCardId", null);
                form.setFieldValue("categoryId", null);
              }}
            />
          </Field>
        )}
      </form.Field>

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

      <form.Field name={isCardPurchase ? "creditCardId" : "walletId"}>
        {(field) => (
          <Field
            label={isCardPurchase ? t("common.card") : t("common.wallet")}
            errors={fieldErrors(field)}
          >
            <Select
              label={isCardPurchase ? t("common.card") : t("common.wallet")}
              items={accountItems}
              value={field.state.value ?? ""}
              placeholder={
                isCardPurchase
                  ? t("recurring.selectACard")
                  : t("recurring.selectAWallet")
              }
              disabled={
                (isCardPurchase ? cardsPending : walletsPending) ||
                accountItems.length === 0
              }
              invalid={isFieldInvalid(field)}
              onValueChange={(value) => field.handleChange(value || null)}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="amountCents">
        {(field) => (
          <Field
            label={t("common.amount")}
            description={t("recurring.field.amountHint")}
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

      <form.Field name="recurrenceType">
        {(field) => (
          <Field
            label={t("recurring.field.repeats")}
            description={
              isFixed
                ? t("recurring.field.fixedHint")
                : t("recurring.field.openEndedHint", { years: RECURRENCE_YEARS })
            }
            errors={fieldErrors(field)}
          >
            <Select
              label={t("recurring.field.repeats")}
              items={recurrenceItems}
              value={field.state.value}
              invalid={isFieldInvalid(field)}
              onValueChange={(value) => {
                const next = value as RecurrenceType;

                field.handleChange(next);

                // Only a fixed series carries a count.
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
            label={t("recurring.field.every")}
            description={t("recurring.field.intervalHint", {
              unit: t(INTERVAL_UNIT[recurrenceType]),
            })}
            errors={fieldErrors(field)}
          >
            <Input
              keyboardType="number-pad"
              value={`${field.state.value}`}
              invalid={isFieldInvalid(field)}
              accessibilityLabel={t("recurring.field.every")}
              onBlur={field.handleBlur}
              onChangeText={(text) => field.handleChange(Number(text || 0))}
            />
          </Field>
        )}
      </form.Field>

      {isFixed && (
        <form.Field name="installments">
          {(field) => (
            <Field label={t("recurring.field.installments")} errors={fieldErrors(field)}>
              <Input
                keyboardType="number-pad"
                value={field.state.value === null ? "" : `${field.state.value}`}
                invalid={isFieldInvalid(field)}
                accessibilityLabel={t("recurring.field.installments")}
                onBlur={field.handleBlur}
                onChangeText={(text) => field.handleChange(text ? Number(text) : null)}
              />
            </Field>
          )}
        </form.Field>
      )}

      <form.Field name="startsOn">
        {(field) => (
          <Field label={t("recurring.field.startsOn")} errors={fieldErrors(field)}>
            <DatePicker
              label={t("recurring.field.startsOn")}
              value={field.state.value}
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
