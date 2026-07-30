import {
  WalletCurrency,
  WalletCurrencyLabelMap,
  WalletType,
  WalletTypeLabelMap,
} from "@budget-manager/schemas";
import { CurrencyInput } from "@budget-manager/ui/components/currency-input";
import {
  Field,
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
import type { UseWalletFormReturnType } from "../hooks/use-wallet-form";

const WALLET_TYPE_ITEMS = Object.values(WalletType).map((type) => ({
  label: WalletTypeLabelMap[type],
  value: type,
}));

const WALLET_CURRENCY_ITEMS = Object.values(WalletCurrency).map((currency) => ({
  label: WalletCurrencyLabelMap[currency],
  value: currency,
}));

function OpeningBalanceField({ form }: { form: UseWalletFormReturnType }) {
  const currencyCode = useSelector(
    form.store,
    (state) => state.values.currencyCode,
  );

  return (
    <form.Field name="openingBalanceCents">
      {(field) => {
        const showErrors =
          field.state.meta.isTouched && !field.state.meta.isValid;
        const errorId = `${field.name}-error`;

        return (
          <Field data-invalid={showErrors}>
            <FieldLabel htmlFor={field.name}>Opening Balance</FieldLabel>
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

export function WalletFormFields({ form }: { form: UseWalletFormReturnType }) {
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

      <form.Field name="type">
        {(field) => {
          const showErrors =
            field.state.meta.isTouched && !field.state.meta.isValid;
          const errorId = `${field.name}-error`;

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>Type</FieldLabel>
              <Select
                items={WALLET_TYPE_ITEMS}
                id={field.name}
                name={field.name}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as WalletType)
                }
              >
                <SelectTrigger
                  aria-invalid={showErrors || undefined}
                  aria-describedby={showErrors ? errorId : undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WALLET_TYPE_ITEMS.map((item) => (
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

      <form.Field name="currencyCode">
        {(field) => {
          const showErrors =
            field.state.meta.isTouched && !field.state.meta.isValid;
          const errorId = `${field.name}-error`;

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>Currency</FieldLabel>
              <Select
                items={WALLET_CURRENCY_ITEMS}
                id={field.name}
                name={field.name}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as WalletCurrency)
                }
              >
                <SelectTrigger
                  aria-invalid={showErrors || undefined}
                  aria-describedby={showErrors ? errorId : undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WALLET_CURRENCY_ITEMS.map((item) => (
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

      <OpeningBalanceField form={form} />
    </FieldGroup>
  );
}
