import {
  fieldErrors,
  isFieldInvalid,
  useBillOptionsQuery,
  type UseCardPaymentFormReturnType,
  useCreditCardOptionsQuery,
  useEnumLabels,
  useWalletOptionsQuery,
} from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { TransactionStatus } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldGroup, FieldRow } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const NO_BILL = "none";

export function CardPaymentFormFields({
  form,
}: {
  form: UseCardPaymentFormReturnType;
}) {
  const { t, formatDateString } = useI18n();
  const labels = useEnumLabels();
  const creditCardId = useSelector(form.store, (state) => state.values.creditCardId);

  const { data: cards, isPending: cardsPending } = useCreditCardOptionsQuery();
  const { data: wallets, isPending: walletsPending } = useWalletOptionsQuery();
  const { data: bills, isPending: billsPending } = useBillOptionsQuery(
    creditCardId || null,
  );

  const cardCurrency = cards?.find((card) => card.id === creditCardId)?.currencyCode;

  const cardItems = (cards ?? []).map((card) => ({
    label: `${card.name} (${card.currencyCode})`,
    value: card.id,
  }));

  // Same-currency wallets only; the server rejects the rest anyway. Switching the
  // card empties this field by itself — the picker drops a value that is no longer
  // among its own items, so no reset belongs here.
  const walletItems = (wallets ?? [])
    .filter((wallet) => !cardCurrency || wallet.currencyCode === cardCurrency)
    .map((wallet) => ({ label: wallet.name, value: wallet.id }));

  const billItems = [
    { label: t("transaction.field.notAllocated"), value: NO_BILL },
    ...(bills?.rows ?? [])
      .filter((bill) => bill.remainingCents > 0)
      .map((bill) => ({
        label: `${formatDateString(bill.periodStart, "dayShort")} → ${formatDateString(
          bill.periodEnd,
          "day",
        )}`,
        value: bill.id,
      })),
  ];

  const statusItems = Object.values(TransactionStatus).map((status) => ({
    label: labels.transactionStatus(status),
    value: status,
  }));

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
              description={t("transaction.field.cardPaymentAmountHint")}
              errors={fieldErrors(field)}
            >
              <CurrencyInput
                value={field.state.value}
                currencyCode={cardCurrency ?? "BRL"}
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

      <form.Field name="walletId">
        {(field) => (
          <Field
            label={t("transaction.field.payFromWallet")}
            errors={fieldErrors(field)}
          >
            <Select
              label={t("transaction.field.payFromWallet")}
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

      <form.Field name="creditCardBillId">
        {(field) => (
          <Field
            label={t("transaction.field.statement")}
            // Allocating the payment is what lets a statement show as paid;
            // leaving it unset still reduces the card's overall balance.
            description={t("transaction.field.statementHint")}
            errors={fieldErrors(field)}
          >
            <Select
              label={t("transaction.field.statement")}
              items={billItems}
              value={field.state.value ?? NO_BILL}
              disabled={!creditCardId || billsPending}
              invalid={isFieldInvalid(field)}
              onValueChange={(value) =>
                field.handleChange(value === NO_BILL || !value ? null : value)
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
