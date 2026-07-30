import { useCreditCardOptionsQuery } from "@/modules/credit-card/queries/use-credit-card-options-query";
import { useCategoryOptionsQuery } from "@/modules/category/queries/use-category-options-query";
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
import type { UseCardPurchaseFormReturnType } from "../hooks/use-card-purchase-form";
import { CategoryType } from "@budget-manager/schemas";
import { TRANSACTION_CATEGORY_NONE } from "../types";

const STATUS_ITEMS = Object.values(TransactionStatus).map((status) => ({
  label: TransactionStatusLabelMap[status],
  value: status,
}));

function CardAmountField({ form }: { form: UseCardPurchaseFormReturnType }) {
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
              Adds to what the card owes. No wallet moves until you pay the
              bill.
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

export function CardPurchaseFormFields({
  form,
}: {
  form: UseCardPurchaseFormReturnType;
}) {
  const { data: cards, isPending: cardsPending } = useCreditCardOptionsQuery();
  // Buying on a card is spending, so only expense categories apply.
  const { data: categories, isPending: categoriesPending } =
    useCategoryOptionsQuery(CategoryType.EXPENSE);

  const cardItems = (cards ?? []).map((card) => ({
    label: `${card.name} (${card.currencyCode})`,
    value: card.id,
  }));

  const categoryItems = [
    { label: "Uncategorized", value: TRANSACTION_CATEGORY_NONE },
    ...(categories ?? []).map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ];

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
        <form.Field name="categoryId">
          {(field) => {
            const showErrors =
              field.state.meta.isTouched && !field.state.meta.isValid;
            const errorId = `${field.name}-error`;

            return (
              <Field data-invalid={showErrors}>
                <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                <Select<string>
                  items={categoryItems}
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? TRANSACTION_CATEGORY_NONE}
                  disabled={categoriesPending}
                  onValueChange={(value) =>
                    field.handleChange(
                      value === TRANSACTION_CATEGORY_NONE ? null : value,
                    )
                  }
                >
                  <SelectTrigger
                    aria-invalid={showErrors || undefined}
                    aria-describedby={showErrors ? errorId : undefined}
                  >
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
                <FieldError
                  id={errorId}
                  errors={showErrors ? field.state.meta.errors : []}
                />
              </Field>
            );
          }}
        </form.Field>
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
