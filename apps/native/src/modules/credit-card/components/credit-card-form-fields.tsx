import {
  fieldErrors,
  isFieldInvalid,
  type UseCreditCardFormReturnType,
  useEnumLabels,
  useWalletOptionsQuery,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { WalletCurrency } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, FieldGroup, FieldRow } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const NO_WALLET = "none";

export function CreditCardFormFields({
  form,
}: {
  form: UseCreditCardFormReturnType;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  // Annotated as a plain string: a wallet's `currencyCode` comes from a `text`
  // column, so comparing the two as enums is not what this is.
  const currencyCode: string = useSelector(
    form.store,
    (state) => state.values.currencyCode,
  );
  const { data: wallets, isPending: walletsPending } = useWalletOptionsQuery();

  const currencyItems = Object.values(WalletCurrency).map((currency) => ({
    label: labels.currency(currency),
    value: currency,
  }));

  // The server rejects a mismatch; only offering same-currency wallets keeps the
  // user from hitting that error in the first place.
  const walletItems = [
    { label: t("creditCard.field.noBillingWallet"), value: NO_WALLET },
    ...(wallets ?? [])
      .filter((wallet) => wallet.currencyCode === currencyCode)
      .map((wallet) => ({ label: wallet.name, value: wallet.id })),
  ];

  return (
    <FieldGroup>
      <form.Field name="name">
        {(field) => (
          <Field label={t("common.name")} errors={fieldErrors(field)}>
            <Input
              value={field.state.value}
              invalid={isFieldInvalid(field)}
              accessibilityLabel={t("common.name")}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
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
              onValueChange={(value) => {
                field.handleChange(value as WalletCurrency);
                // A wallet in the old currency would now be invalid. The old
                // value is still a legal option, so the primitive cannot see
                // that only its *meaning* changed — this reset is not redundant.
                form.setFieldValue("defaultBillingWalletId", null);
              }}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="limitCents">
        {(field) => (
          <Field label={t("creditCard.column.limit")} errors={fieldErrors(field)}>
            <CurrencyInput
              value={field.state.value}
              currencyCode={currencyCode}
              invalid={isFieldInvalid(field)}
              accessibilityLabel={t("creditCard.column.limit")}
              onValueChange={field.handleChange}
              onBlur={field.handleBlur}
            />
          </Field>
        )}
      </form.Field>

      <FieldRow>
        <form.Field name="closeDay">
          {(field) => (
            <Field
              label={t("creditCard.field.closingDay")}
              description={t("creditCard.field.closingDayHint")}
              errors={fieldErrors(field)}
            >
              <Input
                keyboardType="number-pad"
                value={`${field.state.value}`}
                invalid={isFieldInvalid(field)}
                accessibilityLabel={t("creditCard.field.closingDay")}
                onBlur={field.handleBlur}
                onChangeText={(text) => field.handleChange(Number(text || 0))}
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="dueDay">
          {(field) => (
            <Field
              label={t("creditCard.field.dueDay")}
              description={t("creditCard.field.dueDayHint")}
              errors={fieldErrors(field)}
            >
              <Input
                keyboardType="number-pad"
                value={`${field.state.value}`}
                invalid={isFieldInvalid(field)}
                accessibilityLabel={t("creditCard.field.dueDay")}
                onBlur={field.handleBlur}
                onChangeText={(text) => field.handleChange(Number(text || 0))}
              />
            </Field>
          )}
        </form.Field>
      </FieldRow>

      <form.Field name="defaultBillingWalletId">
        {(field) => (
          <Field
            label={t("creditCard.column.billingWallet")}
            description={t("creditCard.field.billingWalletHint")}
            errors={fieldErrors(field)}
          >
            <Select
              label={t("creditCard.column.billingWallet")}
              items={walletItems}
              value={field.state.value ?? NO_WALLET}
              disabled={walletsPending}
              invalid={isFieldInvalid(field)}
              onValueChange={(value) =>
                field.handleChange(value === NO_WALLET || !value ? null : value)
              }
            />
          </Field>
        )}
      </form.Field>
    </FieldGroup>
  );
}
