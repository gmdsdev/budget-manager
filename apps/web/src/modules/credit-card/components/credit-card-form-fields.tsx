import { useWalletOptionsQuery } from "@/modules/wallet/queries/use-wallet-options-query";
import {
  WalletCurrency,
  WalletCurrencyLabelMap,
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
import type { UseCreditCardFormReturnType } from "../hooks/use-credit-card-form";

const CURRENCY_ITEMS = Object.values(WalletCurrency).map((currency) => ({
  label: WalletCurrencyLabelMap[currency],
  value: currency,
}));

const NO_WALLET = "none";

function LimitField({ form }: { form: UseCreditCardFormReturnType }) {
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
            <FieldLabel htmlFor={field.name}>Limit</FieldLabel>
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
  const currencyCode: string = useSelector(
    form.store,
    (state) => state.values.currencyCode,
  );
  const { data: wallets, isPending } = useWalletOptionsQuery();

  // The server rejects a mismatch; only offering same-currency wallets keeps
  // the user from hitting that error in the first place.
  const items = [
    { label: "None", value: NO_WALLET },
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
            <FieldLabel htmlFor={field.name}>Billing wallet</FieldLabel>
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
              Suggested when you record a payment. Must match the card currency.
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
  return (
    <FieldGroup>
      <form.Field name="name">
        {(field) => {
          const showErrors =
            field.state.meta.isTouched && !field.state.meta.isValid;
          const errorId = `${field.name}-error`;

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
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
              <FieldLabel htmlFor={field.name}>Currency</FieldLabel>
              <Select
                items={CURRENCY_ITEMS}
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
                  {CURRENCY_ITEMS.map((item) => (
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
        label="Closing day"
        description="Day of the month the statement closes (1–28)."
      />

      <DayField
        form={form}
        name="dueDay"
        label="Due day"
        description="Day of the month the bill is due (1–28)."
      />

      <BillingWalletField form={form} />
    </FieldGroup>
  );
}
