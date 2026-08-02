import {
  CategoryItemLabel,
  CategoryLabel,
  type CategoryItem,
} from "@/modules/category/components/category-dot";
import { useCategoryOptionsQuery } from "@budget-manager/client/react";
import { useCreditCardOptionsQuery } from "@budget-manager/client/react";
import { useWalletOptionsQuery } from "@budget-manager/client/react";
import { useEnumLabels } from "@budget-manager/client/react";
import type { MessageKey } from "@budget-manager/i18n";
import { useTranslate } from "@budget-manager/i18n/react";
import {
  CategoryType,
  RECURRENCE_YEARS,
  RECURRING_KINDS,
  RecurrenceType,
  TransactionKind,
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
import type { UseRecurringFormReturnType } from "@budget-manager/client/react";

const NONE = "none";

const INTERVAL_UNIT = {
  [RecurrenceType.FIXED]: "recurring.unit.months",
  [RecurrenceType.WEEKLY]: "recurring.unit.weeks",
  [RecurrenceType.MONTHLY]: "recurring.unit.months",
  [RecurrenceType.YEARLY]: "recurring.unit.years",
} as const satisfies Record<RecurrenceType, MessageKey>;

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
  const t = useTranslate();
  const labels = useEnumLabels();
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

  const kindItems = RECURRING_KINDS.map((value) => ({
    label: labels.transactionKind(value),
    value,
  }));

  const recurrenceItems = Object.values(RecurrenceType).map((type) => ({
    label: labels.recurrenceType(type),
    value: type,
  }));

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

  const categoryItems: CategoryItem[] = [
    { label: t("category.uncategorized"), value: NONE, color: null },
    ...(categories ?? []).map((category) => ({
      label: category.name,
      value: category.id,
      color: category.color,
    })),
  ];

  return (
    <FieldGroup>
      <form.Field name="kind">
        {(field) => {
          const showErrors = invalid(field);

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>
                {t("recurring.field.kind")}
              </FieldLabel>
              <Select
                items={kindItems}
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
                  {kindItems.map((item) => (
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
              <FieldLabel htmlFor={field.name}>
                {t("common.description")}
              </FieldLabel>
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
                {isCardPurchase ? t("common.card") : t("common.wallet")}
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
                      isCardPurchase
                        ? t("recurring.selectACard")
                        : t("recurring.selectAWallet")
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
              <FieldLabel htmlFor={field.name}>
                {t("common.amount")}
              </FieldLabel>
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
                {t("recurring.field.amountHint")}
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
              <FieldLabel htmlFor={field.name}>
                {t("recurring.field.repeats")}
              </FieldLabel>
              <Select
                items={recurrenceItems}
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
                  {recurrenceItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {isFixed
                  ? t("recurring.field.fixedHint")
                  : t("recurring.field.openEndedHint", {
                      years: RECURRENCE_YEARS,
                    })}
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
              <FieldLabel htmlFor={field.name}>
                {t("recurring.field.every")}
              </FieldLabel>
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
                {t("recurring.field.intervalHint", {
                  unit: t(INTERVAL_UNIT[recurrenceType]),
                })}
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
                <FieldLabel htmlFor={field.name}>
                  {t("recurring.field.installments")}
                </FieldLabel>
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
              <FieldLabel htmlFor={field.name}>
                {t("recurring.field.startsOn")}
              </FieldLabel>
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
              <FieldLabel htmlFor={field.name}>
                {t("common.category")}
              </FieldLabel>
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
                  <SelectValue>
                    {(selected: string) => (
                      <CategoryItemLabel
                        items={categoryItems}
                        value={selected}
                      />
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categoryItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <CategoryLabel color={item.color} name={item.label} />
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
              <FieldLabel htmlFor={field.name}>{t("common.notes")}</FieldLabel>
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
