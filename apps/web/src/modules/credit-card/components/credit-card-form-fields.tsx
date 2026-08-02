import { useWalletOptionsQuery } from "@budget-manager/client/react";
import { useEnumLabels } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { WalletCurrency } from "@budget-manager/schemas";
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
import type { UseCreditCardFormReturnType } from "@budget-manager/client/react";

const NO_WALLET = "none";

function LimitField({ form }: { form: UseCreditCardFormReturnType }) {
  const t = useTranslate();
  const currencyCode = useSelector(
    form.store,
    (state) => state.values.currencyCode,
  );

  return (
    <form.Field name="limitCents">
      {(field) => {
        const showErrors =
          field.state.meta.isTouched && !field.state.meta.isValid;
        const errorId = `${field.name}-error`;

        return (
          <Field data-invalid={showErrors}>
            <FieldLabel htmlFor={field.name}>
              {t("creditCard.column.limit")}
            </FieldLabel>
            <CurrencyInput
              id={field.name}
              name={field.name}
              value={field.state.value}
              currencyCode={currencyCode}
              onValueChange={field.handleChange}
              onBlur={field.handleBlur}
              aria-invalid={showErrors || undefined}
              aria-describedby={showErrors ? errorId : undefined}
            />
            <FieldError
              id={errorId}
              errors={showErrors ? field.state.meta.errors : []}
            />
          </Field>
        );
      }}
    </form.Field>
  );
}

function BillingWalletField({ form }: { form: UseCreditCardFormReturnType }) {
  const t = useTranslate();
  const currencyCode: string = useSelector(
    form.store,
    (state) => state.values.currencyCode,
  );
  const { data: wallets, isPending } = useWalletOptionsQuery();

  // The server rejects a mismatch; only offering same-currency wallets keeps
  // the user from hitting that error in the first place.
  const items = [
    { label: t("creditCard.field.noBillingWallet"), value: NO_WALLET },
    ...(wallets ?? [])
      .filter((wallet) => wallet.currencyCode === currencyCode)
      .map((wallet) => ({ label: wallet.name, value: wallet.id })),
  ];

  return (
    <form.Field name="defaultBillingWalletId">
      {(field) => {
        const showErrors =
          field.state.meta.isTouched && !field.state.meta.isValid;
        const errorId = `${field.name}-error`;

        return (
          <Field data-invalid={showErrors}>
            <FieldLabel htmlFor={field.name}>
              {t("creditCard.column.billingWallet")}
            </FieldLabel>
            <Select<string>
              items={items}
              id={field.name}
              name={field.name}
              value={field.state.value ?? NO_WALLET}
              disabled={isPending}
              onValueChange={(value) =>
                field.handleChange(value === NO_WALLET ? null : value)
              }
            >
              <SelectTrigger
                aria-invalid={showErrors || undefined}
                aria-describedby={showErrors ? errorId : undefined}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              {t("creditCard.field.billingWalletHint")}
            </FieldDescription>
            <FieldError
              id={errorId}
              errors={showErrors ? field.state.meta.errors : []}
            />
          </Field>
        );
      }}
    </form.Field>
  );
}

function DayField({
  form,
  name,
  label,
  description,
}: {
  form: UseCreditCardFormReturnType;
  name: "closeDay" | "dueDay";
  label: string;
  description: string;
}) {
  return (
    <form.Field name={name}>
      {(field) => {
        const showErrors =
          field.state.meta.isTouched && !field.state.meta.isValid;
        const errorId = `${field.name}-error`;

        return (
          <Field data-invalid={showErrors}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              type="number"
              min={1}
              max={28}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) =>
                field.handleChange(Number(event.target.value))
              }
              aria-invalid={showErrors || undefined}
              aria-describedby={showErrors ? errorId : undefined}
            />
            <FieldDescription>{description}</FieldDescription>
            <FieldError
              id={errorId}
              errors={showErrors ? field.state.meta.errors : []}
            />
          </Field>
        );
      }}
    </form.Field>
  );
}

export function CreditCardFormFields({
  form,
}: {
  form: UseCreditCardFormReturnType;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();

  const currencyItems = Object.values(WalletCurrency).map((currency) => ({
    label: labels.currency(currency),
    value: currency,
  }));

  return (
    <FieldGroup>
      <form.Field name="name">
        {(field) => {
          const showErrors =
            field.state.meta.isTouched && !field.state.meta.isValid;
          const errorId = `${field.name}-error`;

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>{t("common.name")}</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={showErrors || undefined}
                aria-describedby={showErrors ? errorId : undefined}
              />
              <FieldError
                id={errorId}
                errors={showErrors ? field.state.meta.errors : []}
              />
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="currencyCode">
        {(field) => {
          const showErrors =
            field.state.meta.isTouched && !field.state.meta.isValid;
          const errorId = `${field.name}-error`;

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>{t("common.currency")}</FieldLabel>
              <Select
                items={currencyItems}
                id={field.name}
                name={field.name}
                value={field.state.value}
                onValueChange={(value) => {
                  field.handleChange(value as WalletCurrency);
                  // A wallet in the old currency would now be invalid.
                  form.setFieldValue("defaultBillingWalletId", null);
                }}
              >
                <SelectTrigger
                  aria-invalid={showErrors || undefined}
                  aria-describedby={showErrors ? errorId : undefined}
                >
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
              <FieldError
                id={errorId}
                errors={showErrors ? field.state.meta.errors : []}
              />
            </Field>
          );
        }}
      </form.Field>

      <LimitField form={form} />

      <DayField
        form={form}
        name="closeDay"
        label={t("creditCard.field.closingDay")}
        description={t("creditCard.field.closingDayHint")}
      />

      <DayField
        form={form}
        name="dueDay"
        label={t("creditCard.field.dueDay")}
        description={t("creditCard.field.dueDayHint")}
      />

      <BillingWalletField form={form} />
    </FieldGroup>
  );
}
