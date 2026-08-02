import {
  fieldErrors,
  isFieldInvalid,
  useEnumLabels,
  type UseTransferFormReturnType,
  useWalletOptionsQuery,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { TransactionStatus } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldGroup, FieldRow } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function TransferFormFields({ form }: { form: UseTransferFormReturnType }) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const { data: wallets, isPending } = useWalletOptionsQuery();
  const fromWalletId = useSelector(form.store, (state) => state.values.fromWalletId);

  // Both legs share a currency, so the wallet's code rides in its label — a
  // transfer between two currencies is not something the server will accept.
  const walletItems = (wallets ?? []).map((wallet) => ({
    label: `${wallet.name} (${wallet.currencyCode})`,
    value: wallet.id,
  }));

  const statusItems = Object.values(TransactionStatus).map((status) => ({
    label: labels.transactionStatus(status),
    value: status,
  }));

  const currencyCode =
    wallets?.find((wallet) => wallet.id === fromWalletId)?.currencyCode ?? "BRL";

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
              description={t("transaction.field.transferCurrencyHint")}
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

      <form.Field name="fromWalletId">
        {(field) => (
          <Field label={t("transaction.field.fromWallet")} errors={fieldErrors(field)}>
            <Select
              label={t("transaction.field.fromWallet")}
              items={walletItems}
              value={field.state.value}
              placeholder={t("transaction.field.selectAWallet")}
              disabled={isPending || walletItems.length === 0}
              invalid={isFieldInvalid(field)}
              onValueChange={field.handleChange}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="toWalletId">
        {(field) => (
          <Field label={t("transaction.field.toWallet")} errors={fieldErrors(field)}>
            <Select
              label={t("transaction.field.toWallet")}
              items={walletItems}
              value={field.state.value}
              placeholder={t("transaction.field.selectAWallet")}
              disabled={isPending || walletItems.length === 0}
              invalid={isFieldInvalid(field)}
              onValueChange={field.handleChange}
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
