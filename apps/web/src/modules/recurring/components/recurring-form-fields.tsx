import { useCategoryOptionsQuery } from "@/modules/category/queries/use-category-options-query";
import { useCreditCardOptionsQuery } from "@/modules/credit-card/queries/use-credit-card-options-query";
import { useWalletOptionsQuery } from "@/modules/wallet/queries/use-wallet-options-query";
import {
  CategoryType,
  RECURRENCE_YEARS,
  RECURRING_KINDS,
  RecurrenceType,
  RecurrenceTypeLabelMap,
  TransactionKind,
  TransactionKindLabelMap,
  type RecurringKind,
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
import type { UseRecurringFormReturnType } from "../hooks/use-recurring-form";

const KIND_ITEMS = RECURRING_KINDS.map((kind) => ({
  label: TransactionKindLabelMap[kind],
  value: kind,
}));

const RECURRENCE_ITEMS = Object.values(RecurrenceType).map((type) => ({
  label: RecurrenceTypeLabelMap[type],
  value: type,
}));

const NONE = "none";

const INTERVAL_UNIT: Record<RecurrenceType, string> = {
  [RecurrenceType.FIXED]: "months",
  [RecurrenceType.WEEKLY]: "weeks",
  [RecurrenceType.MONTHLY]: "months",
  [RecurrenceType.YEARLY]: "years",
};

function invalid(field: {
  state: { meta: { isTouched: boolean; isValid: boolean } };
}) {
  return field.state.meta.isTouched && !field.state.meta.isValid;
}

export function RecurringFormFields({
  form,
}: {
  form: UseRecurringFormReturnType;
}) {
  const kind = useSelector(form.store, (state) => state.values.kind);
  const recurrenceType = useSelector(
    form.store,
    (state) => state.values.recurrenceType,
  );
  const walletId = useSelector(form.store, (state) => state.values.walletId);
  const creditCardId = useSelector(
    form.store,
    (state) => state.values.creditCardId,
  );

  const isCardPurchase = kind === TransactionKind.CREDIT_CARD_PURCHASE;
  const isFixed = recurrenceType === RecurrenceType.FIXED;

  const { data: wallets, isPending: walletsPending } = useWalletOptionsQuery();
  const { data: cards, isPending: cardsPending } = useCreditCardOptionsQuery();
  const { data: categories, isPending: categoriesPending } =
    useCategoryOptionsQuery(
      kind === TransactionKind.INCOME ? CategoryType.INCOME : CategoryType.EXPENSE,
    );

  const currencyCode = isCardPurchase
    ? cards?.find((card) => card.id === creditCardId)?.currencyCode ?? "BRL"
    : wallets?.find((wallet) => wallet.id === walletId)?.currencyCode ?? "BRL";

  const accountItems = isCardPurchase
    ? (cards ?? []).map((card) => ({
        label: `${card.name} (${card.currencyCode})`,
        value: card.id,
      }))
    : (wallets ?? []).map((wallet) => ({
        label: `${wallet.name} (${wallet.currencyCode})`,
        value: wallet.id,
      }));

  const categoryItems = [
    { label: "Uncategorized", value: NONE },
    ...(categories ?? []).map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ];

  return (
    <FieldGroup>
      <form.Field name="kind">
        {(field) => {
          const showErrors = invalid(field);

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>Kind</FieldLabel>
              <Select
                items={KIND_ITEMS}
                id={field.name}
                name={field.name}
                value={field.state.value}
                onValueChange={(value) => {
                  field.handleChange(value as RecurringKind);
                  // The account and category lists both change with the kind.
                  form.setFieldValue("walletId", null);
                  form.setFieldValue("creditCardId", null);
                  form.setFieldValue("categoryId", null);
                }}
              >
                <SelectTrigger aria-invalid={showErrors || undefined}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIND_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={showErrors ? field.state.meta.errors : []} />
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="name">
        {(field) => {
          const showErrors = invalid(field);

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
              />
              <FieldError errors={showErrors ? field.state.meta.errors : []} />
            </Field>
          );
        }}
      </form.Field>

      <form.Field name={isCardPurchase ? "creditCardId" : "walletId"}>
        {(field) => {
          const showErrors = invalid(field);

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>
                {isCardPurchase ? "Card" : "Wallet"}
              </FieldLabel>
              <Select<string>
                items={accountItems}
                id={field.name}
                name={field.name}
                value={field.state.value ?? ""}
                disabled={
                  (isCardPurchase ? cardsPending : walletsPending) ||
                  accountItems.length === 0
                }
                onValueChange={(value) => field.handleChange(value ?? "")}
              >
                <SelectTrigger aria-invalid={showErrors || undefined}>
                  <SelectValue
                    placeholder={
                      isCardPurchase ? "Select a card" : "Select a wallet"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {accountItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={showErrors ? field.state.meta.errors : []} />
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="amountCents">
        {(field) => {
          const showErrors = invalid(field);

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
              />
              <FieldDescription>
                Charged on every occurrence in the series.
              </FieldDescription>
              <FieldError errors={showErrors ? field.state.meta.errors : []} />
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="recurrenceType">
        {(field) => {
          const showErrors = invalid(field);

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>Repeats</FieldLabel>
              <Select
                items={RECURRENCE_ITEMS}
                id={field.name}
                name={field.name}
                value={field.state.value}
                onValueChange={(value) => {
                  const next = value as RecurrenceType;

                  field.handleChange(next);

                  // Only a fixed series carries a count.
                  if (next !== RecurrenceType.FIXED) {
                    form.setFieldValue("installments", null);
                  }
                }}
              >
                <SelectTrigger aria-invalid={showErrors || undefined}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {isFixed
                  ? "A set number of monthly installments."
                  : `Repeats for the next ${RECURRENCE_YEARS} years; a year is materialized at a time.`}
              </FieldDescription>
              <FieldError errors={showErrors ? field.state.meta.errors : []} />
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="interval">
        {(field) => {
          const showErrors = invalid(field);

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>Every</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="number"
                min={1}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(Number(event.target.value))
                }
                aria-invalid={showErrors || undefined}
              />
              <FieldDescription>
                {INTERVAL_UNIT[recurrenceType]} between occurrences.
              </FieldDescription>
              <FieldError errors={showErrors ? field.state.meta.errors : []} />
            </Field>
          );
        }}
      </form.Field>

      {isFixed && (
        <form.Field name="installments">
          {(field) => {
            const showErrors = invalid(field);

            return (
              <Field data-invalid={showErrors}>
                <FieldLabel htmlFor={field.name}>Installments</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  min={1}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                  aria-invalid={showErrors || undefined}
                />
                <FieldError errors={showErrors ? field.state.meta.errors : []} />
              </Field>
            );
          }}
        </form.Field>
      )}

      <form.Field name="startsOn">
        {(field) => {
          const showErrors = invalid(field);

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>Starts on</FieldLabel>
              <DatePicker
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onValueChange={field.handleChange}
                aria-invalid={showErrors || undefined}
              />
              <FieldError errors={showErrors ? field.state.meta.errors : []} />
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="categoryId">
        {(field) => {
          const showErrors = invalid(field);

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>Category</FieldLabel>
              <Select
                items={categoryItems}
                id={field.name}
                name={field.name}
                value={field.state.value ?? NONE}
                disabled={categoriesPending}
                onValueChange={(value) =>
                  field.handleChange(value === NONE ? null : value)
                }
              >
                <SelectTrigger aria-invalid={showErrors || undefined}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={showErrors ? field.state.meta.errors : []} />
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="notes">
        {(field) => {
          const showErrors = invalid(field);

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
              />
              <FieldError errors={showErrors ? field.state.meta.errors : []} />
            </Field>
          );
        }}
      </form.Field>
    </FieldGroup>
  );
}
