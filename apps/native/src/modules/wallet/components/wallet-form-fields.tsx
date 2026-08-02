import {
  fieldErrors,
  isFieldInvalid,
  useEnumLabels,
  type UseWalletFormReturnType,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { WalletCurrency, WalletType } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function WalletFormFields({ form }: { form: UseWalletFormReturnType }) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const currencyCode = useSelector(form.store, (state) => state.values.currencyCode);

  const typeItems = Object.values(WalletType).map((type) => ({
    label: labels.walletType(type),
    value: type,
  }));

  const currencyItems = Object.values(WalletCurrency).map((currency) => ({
    label: labels.currency(currency),
    value: currency,
  }));

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

      <form.Field name="type">
        {(field) => (
          <Field label={t("common.type")} errors={fieldErrors(field)}>
            <Select
              label={t("common.type")}
              items={typeItems}
              value={field.state.value}
              invalid={isFieldInvalid(field)}
              onValueChange={(value) => field.handleChange(value as WalletType)}
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

      <form.Field name="openingBalanceCents">
        {(field) => (
          <Field label={t("wallet.column.openingBalance")} errors={fieldErrors(field)}>
            <CurrencyInput
              value={field.state.value}
              // Reformats when the currency changes, so choosing a currency
              // after typing an amount re-renders it in the new one.
              currencyCode={currencyCode}
              invalid={isFieldInvalid(field)}
              accessibilityLabel={t("wallet.column.openingBalance")}
              onValueChange={field.handleChange}
              onBlur={field.handleBlur}
            />
          </Field>
        )}
      </form.Field>
    </FieldGroup>
  );
}
