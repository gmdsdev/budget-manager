import { useWalletOptionsQuery } from "@/modules/wallet/queries/use-wallet-options-query";
import {
  TransactionStatus,
  TransactionStatusLabelMap,
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
import { Textarea } from "@budget-manager/ui/components/textarea";
import { useSelector } from "@tanstack/react-form";
import { FieldRow } from "./field-row";
import type { UseTransferFormReturnType } from "../hooks/use-transfer-form";

const STATUS_ITEMS = Object.values(TransactionStatus).map((status) => ({
  label: TransactionStatusLabelMap[status],
  value: status,
}));

function WalletSelectField({
  form,
  name,
  label,
}: {
  form: UseTransferFormReturnType;
  name: "fromWalletId" | "toWalletId";
  label: string;
}) {
  const { data: wallets, isPending } = useWalletOptionsQuery();

  const items = (wallets ?? []).map((wallet) => ({
    label: `${wallet.name} (${wallet.currencyCode})`,
    value: wallet.id,
  }));

  return (
    <form.Field name={name}>
      {(field) => {
        const showErrors =
          field.state.meta.isTouched && !field.state.meta.isValid;
        const errorId = `${field.name}-error`;

        return (
          <Field data-invalid={showErrors}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <Select<string>
              items={items}
              id={field.name}
              name={field.name}
              value={field.state.value}
              disabled={isPending || items.length === 0}
              onValueChange={(value) => field.handleChange(value ?? "")}
            >
              <SelectTrigger
                aria-invalid={showErrors || undefined}
                aria-describedby={showErrors ? errorId : undefined}
              >
                <SelectValue placeholder="Select a wallet" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
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
  );
}

function TransferAmountField({ form }: { form: UseTransferFormReturnType }) {
  const fromWalletId = useSelector(
    form.store,
    (state) => state.values.fromWalletId,
  );
  const { data: wallets } = useWalletOptionsQuery();

  const currencyCode =
    wallets?.find((wallet) => wallet.id === fromWalletId)?.currencyCode ??
    "BRL";

  return (
    <form.Field name="amountCents">
      {(field) => {
        const showErrors =
          field.state.meta.isTouched && !field.state.meta.isValid;
        const errorId = `${field.name}-error`;

        return (
          <Field data-invalid={showErrors}>
            <FieldLabel htmlFor={field.name}>Amount</FieldLabel>
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
            <FieldDescription>
              Both wallets must use the same currency.
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

export function TransferFormFields({
  form,
}: {
  form: UseTransferFormReturnType;
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
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
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

      <FieldRow>
        <TransferAmountField form={form} />
        <form.Field name="occurrenceDate">
          {(field) => {
            const showErrors =
              field.state.meta.isTouched && !field.state.meta.isValid;
            const errorId = `${field.name}-error`;

            return (
              <Field data-invalid={showErrors}>
                <FieldLabel htmlFor={field.name}>Date</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="date"
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
      </FieldRow>

      <FieldRow>
        <WalletSelectField
          form={form}
          name="fromWalletId"
          label="From wallet"
        />
        <WalletSelectField form={form} name="toWalletId" label="To wallet" />
      </FieldRow>

      <form.Field name="status">
        {(field) => {
          const showErrors =
            field.state.meta.isTouched && !field.state.meta.isValid;
          const errorId = `${field.name}-error`;

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>Status</FieldLabel>
              <Select
                items={STATUS_ITEMS}
                id={field.name}
                name={field.name}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as TransactionStatus)
                }
              >
                <SelectTrigger
                  aria-invalid={showErrors || undefined}
                  aria-describedby={showErrors ? errorId : undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ITEMS.map((item) => (
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

      <form.Field name="notes">
        {(field) => {
          const showErrors =
            field.state.meta.isTouched && !field.state.meta.isValid;
          const errorId = `${field.name}-error`;

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>Notes</FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(event.target.value || null)
                }
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
    </FieldGroup>
  );
}
