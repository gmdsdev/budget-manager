import { TRANSACTION_CATEGORY_NONE } from "@budget-manager/client";
import {
  fieldErrors,
  isFieldInvalid,
  useCategoryOptionsQuery,
  useEnumLabels,
  type UseTransactionFormReturnType,
  useWalletOptionsQuery,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import {
  CategoryType,
  TRANSACTION_FORM_KINDS,
  type TransactionFormKind,
  TransactionKind,
  TransactionStatus,
} from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldGroup, FieldRow } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCategoryItems } from "@/modules/category/components/category-items";

const KIND_TO_CATEGORY_TYPE: Record<TransactionFormKind, CategoryType> = {
  [TransactionKind.INCOME]: CategoryType.INCOME,
  [TransactionKind.EXPENSE]: CategoryType.EXPENSE,
};

export function TransactionFormFields({
  form,
  children,
}: {
  form: UseTransactionFormReturnType;
  /** Slot for the recurrence fields, which live on this form by design. */
  children?: React.ReactNode;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();

  const kind = useSelector(form.store, (state) => state.values.kind);
  const walletId = useSelector(form.store, (state) => state.values.walletId);

  const { data: wallets, isPending: walletsPending } = useWalletOptionsQuery();
  const { data: categories, isPending: categoriesPending } = useCategoryOptionsQuery(
    KIND_TO_CATEGORY_TYPE[kind],
  );

  const kindItems = TRANSACTION_FORM_KINDS.map((value) => ({
    label: labels.transactionKind(value),
    value,
  }));

  const statusItems = Object.values(TransactionStatus).map((status) => ({
    label: labels.transactionStatus(status),
    value: status,
  }));

  const walletItems = (wallets ?? []).map((wallet) => ({
    label: wallet.name,
    value: wallet.id,
  }));

  const categoryOptions = useCategoryItems(categories);

  // The amount is formatted in the wallet's currency, so picking the wallet
  // afterwards re-renders it.
  const currencyCode =
    wallets?.find((wallet) => wallet.id === walletId)?.currencyCode ?? "BRL";

  return (
    <FieldGroup>
      <form.Field name="kind">
        {(field) => (
          <Field label={t("transaction.filter.kind")} errors={fieldErrors(field)}>
            <Select
              label={t("transaction.filter.kind")}
              items={kindItems}
              value={field.state.value}
              invalid={isFieldInvalid(field)}
              onValueChange={(value) => {
                field.handleChange(value as TransactionFormKind);
                // The old category is still a legal option and only its
                // *meaning* changed, which the picker cannot see — so this reset
                // is the form's to make.
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

      <FieldRow>
        <form.Field name="amountCents">
          {(field) => (
            <Field label={t("common.amount")} errors={fieldErrors(field)}>
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

      <form.Field name="walletId">
        {(field) => (
          <Field label={t("common.wallet")} errors={fieldErrors(field)}>
            <Select
              label={t("common.wallet")}
              items={walletItems}
              value={field.state.value}
              placeholder={t("transaction.field.selectAWallet")}
              disabled={walletsPending || walletItems.length === 0}
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

      {children}
    </FieldGroup>
  );
}
