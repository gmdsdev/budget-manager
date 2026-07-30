import { useCreditCardOptionsQuery } from "@/modules/credit-card/queries/use-credit-card-options-query";
import { useBillOptionsQuery } from "@/modules/credit-card/queries/use-credit-card-bills-query";
import { useWalletOptionsQuery } from "@/modules/wallet/queries/use-wallet-options-query";
import {
  TransactionStatus,
  TransactionStatusLabelMap,
} from "@budget-manager/schemas";
import { CurrencyInput } from "@budget-manager/ui/components/currency-input";
import { DatePicker } from "@budget-manager/ui/components/date-picker";
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
import type { UseCardPaymentFormReturnType } from "../hooks/use-card-payment-form";

const STATUS_ITEMS = Object.values(TransactionStatus).map((status) => ({
  label: TransactionStatusLabelMap[status],
  value: status,
}));

const NO_BILL = "none";

function formatPeriod(periodStart: string, periodEnd: string) {
  return `${periodStart} → ${periodEnd}`;
}

/**
 * Optional: allocating a payment to a statement is what lets that statement
 * show as paid. Leaving it unset still reduces the card's overall balance.
 */
function BillField({ form }: { form: UseCardPaymentFormReturnType }) {
  const creditCardId = useSelector(
    form.store,
    (state) => state.values.creditCardId,
  );
  const { data, isPending } = useBillOptionsQuery(creditCardId || null);

  const items = [
    { label: "Not allocated", value: NO_BILL },
    ...(data?.rows ?? [])
      .filter((bill) => bill.remainingCents > 0)
      .map((bill) => ({
        label: formatPeriod(bill.periodStart, bill.periodEnd),
        value: bill.id,
      })),
  ];

  return (
    <form.Field name="creditCardBillId">
      {(field) => {
        const showErrors =
          field.state.meta.isTouched && !field.state.meta.isValid;
        const errorId = `${field.name}-error`;

        return (
          <Field data-invalid={showErrors}>
            <FieldLabel htmlFor={field.name}>Statement</FieldLabel>
            <Select<string>
              items={items}
              id={field.name}
              name={field.name}
              value={field.state.value ?? NO_BILL}
              disabled={!creditCardId || isPending}
              onValueChange={(value) =>
                field.handleChange(value === NO_BILL ? null : value)
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
              Allocate this payment to an unpaid statement, or leave it against
              the card as a whole.
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

function CardAmountField({ form }: { form: UseCardPaymentFormReturnType }) {
  const creditCardId = useSelector(
    form.store,
    (state) => state.values.creditCardId,
  );
  const { data: cards } = useCreditCardOptionsQuery();

  const currencyCode =
    cards?.find((card) => card.id === creditCardId)?.currencyCode ?? "BRL";

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
              Leaves the wallet and reduces what the card owes.
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

export function CardPaymentFormFields({
  form,
}: {
  form: UseCardPaymentFormReturnType;
}) {
  const creditCardId = useSelector(
    form.store,
    (state) => state.values.creditCardId,
  );
  const { data: cards, isPending: cardsPending } = useCreditCardOptionsQuery();
  const { data: wallets, isPending: walletsPending } = useWalletOptionsQuery();

  const cardCurrency = cards?.find(
    (card) => card.id === creditCardId,
  )?.currencyCode;

  const cardItems = (cards ?? []).map((card) => ({
    label: `${card.name} (${card.currencyCode})`,
    value: card.id,
  }));

  // Same-currency wallets only; the server rejects the rest anyway.
  const walletItems = (wallets ?? [])
    .filter((wallet) => !cardCurrency || wallet.currencyCode === cardCurrency)
    .map((wallet) => ({ label: wallet.name, value: wallet.id }));

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
        <CardAmountField form={form} />
        <form.Field name="occurrenceDate">
          {(field) => {
            const showErrors =
              field.state.meta.isTouched && !field.state.meta.isValid;
            const errorId = `${field.name}-error`;

            return (
              <Field data-invalid={showErrors}>
                <FieldLabel htmlFor={field.name}>Date</FieldLabel>
                <DatePicker
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onValueChange={field.handleChange}
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
        <form.Field name="creditCardId">
          {(field) => {
            const showErrors =
              field.state.meta.isTouched && !field.state.meta.isValid;
            const errorId = `${field.name}-error`;

            return (
              <Field data-invalid={showErrors}>
                <FieldLabel htmlFor={field.name}>Card</FieldLabel>
                <Select<string>
                  items={cardItems}
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  disabled={cardsPending || cardItems.length === 0}
                  onValueChange={(value) => field.handleChange(value ?? "")}
                >
                  <SelectTrigger
                    aria-invalid={showErrors || undefined}
                    aria-describedby={showErrors ? errorId : undefined}
                  >
                    <SelectValue placeholder="Select a card" />
                  </SelectTrigger>
                  <SelectContent>
                    {cardItems.map((item) => (
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
        <form.Field name="walletId">
          {(field) => {
            const showErrors =
              field.state.meta.isTouched && !field.state.meta.isValid;
            const errorId = `${field.name}-error`;

            return (
              <Field data-invalid={showErrors}>
                <FieldLabel htmlFor={field.name}>Pay from wallet</FieldLabel>
                <Select<string>
                  items={walletItems}
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  disabled={walletsPending || walletItems.length === 0}
                  onValueChange={(value) => field.handleChange(value ?? "")}
                >
                  <SelectTrigger
                    aria-invalid={showErrors || undefined}
                    aria-describedby={showErrors ? errorId : undefined}
                  >
                    <SelectValue placeholder="Select a wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {walletItems.map((item) => (
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
      </FieldRow>

      <BillField form={form} />

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
