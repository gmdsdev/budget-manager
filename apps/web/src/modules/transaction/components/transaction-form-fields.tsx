import {
  CategoryItemLabel,
  CategoryLabel,
  type CategoryItem,
} from "@/modules/category/components/category-dot";
import { useEnumLabels } from "@/lib/enum-labels";
import { useTranslate } from "@budget-manager/i18n/react";
import { useCategoryOptionsQuery } from "@/modules/category/queries/use-category-options-query";
import { useWalletOptionsQuery } from "@/modules/wallet/queries/use-wallet-options-query";
import {
  CategoryType,
  TRANSACTION_FORM_KINDS,
  TransactionKind,
  TransactionStatus,
  type TransactionFormKind,
} from "@budget-manager/schemas";
import { CurrencyInput } from "@budget-manager/ui/components/currency-input";
import { DatePicker } from "@budget-manager/ui/components/date-picker";
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
import { Textarea } from "@budget-manager/ui/components/textarea";
import { useSelector } from "@tanstack/react-form";
import type { UseTransactionFormReturnType } from "../hooks/use-transaction-form";
import { TRANSACTION_CATEGORY_NONE } from "../types";
import { FieldRow } from "./field-row";

const KIND_TO_CATEGORY_TYPE: Record<TransactionFormKind, CategoryType> = {
  [TransactionKind.INCOME]: CategoryType.INCOME,
  [TransactionKind.EXPENSE]: CategoryType.EXPENSE,
};

function AmountField({ form }: { form: UseTransactionFormReturnType }) {
  const t = useTranslate();
  const walletId = useSelector(form.store, (state) => state.values.walletId);
  const { data: wallets } = useWalletOptionsQuery();

  // Amount sits above Wallet per the design. CurrencyInput reformats when the
  // currency changes, so choosing the wallet afterwards re-renders the amount.
  const currencyCode =
    wallets?.find((wallet) => wallet.id === walletId)?.currencyCode ?? "BRL";

  return (
    <form.Field name="amountCents">
      {(field) => {
        const showErrors =
          field.state.meta.isTouched && !field.state.meta.isValid;
        const errorId = `${field.name}-error`;

        return (
          <Field data-invalid={showErrors}>
            <FieldLabel htmlFor={field.name}>{t("common.amount")}</FieldLabel>
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

function WalletField({ form }: { form: UseTransactionFormReturnType }) {
  const t = useTranslate();
  const { data: wallets, isPending } = useWalletOptionsQuery();

  const items = (wallets ?? []).map((wallet) => ({
    label: wallet.name,
    value: wallet.id,
  }));

  return (
    <form.Field name="walletId">
      {(field) => {
        const showErrors =
          field.state.meta.isTouched && !field.state.meta.isValid;
        const errorId = `${field.name}-error`;

        return (
          <Field data-invalid={showErrors}>
            <FieldLabel htmlFor={field.name}>{t("common.wallet")}</FieldLabel>
            <Select
              items={items}
              id={field.name}
              name={field.name}
              value={field.state.value}
              disabled={isPending || items.length === 0}
              onValueChange={(value) => field.handleChange(value as string)}
            >
              <SelectTrigger
                aria-invalid={showErrors || undefined}
                aria-describedby={showErrors ? errorId : undefined}
              >
                <SelectValue placeholder={t("transaction.field.selectAWallet")} />
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

function CategoryField({ form }: { form: UseTransactionFormReturnType }) {
  const t = useTranslate();
  const kind = useSelector(form.store, (state) => state.values.kind);
  const { data: categories, isPending } = useCategoryOptionsQuery(
    KIND_TO_CATEGORY_TYPE[kind],
  );

  const items: CategoryItem[] = [
    {
      label: t("category.uncategorized"),
      value: TRANSACTION_CATEGORY_NONE,
      color: null,
    },
    ...(categories ?? []).map((category) => ({
      label: category.name,
      value: category.id,
      color: category.color,
    })),
  ];

  return (
    <form.Field name="categoryId">
      {(field) => {
        const showErrors =
          field.state.meta.isTouched && !field.state.meta.isValid;
        const errorId = `${field.name}-error`;

        return (
          <Field data-invalid={showErrors}>
            <FieldLabel htmlFor={field.name}>
                  {t("common.category")}
                </FieldLabel>
            <Select
              items={items}
              id={field.name}
              name={field.name}
              value={field.state.value ?? TRANSACTION_CATEGORY_NONE}
              disabled={isPending}
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
                <SelectValue>
                  {(selected: string) => (
                    <CategoryItemLabel items={items} value={selected} />
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    <CategoryLabel color={item.color} name={item.label} />
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

function DateField({ form }: { form: UseTransactionFormReturnType }) {
  const t = useTranslate();
  return (
    <form.Field name="occurrenceDate">
      {(field) => {
        const showErrors =
          field.state.meta.isTouched && !field.state.meta.isValid;
        const errorId = `${field.name}-error`;

        return (
          <Field data-invalid={showErrors}>
            <FieldLabel htmlFor={field.name}>{t("common.date")}</FieldLabel>
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
  );
}

export function TransactionFormFields({
  form,
  children,
}: {
  form: UseTransactionFormReturnType;
  /** Slot for the recurrence fields, which live on this form by design. */
  children?: React.ReactNode;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();

  const kindItems = TRANSACTION_FORM_KINDS.map((kind) => ({
    label: labels.transactionKind(kind),
    value: kind,
  }));

  const statusItems = Object.values(TransactionStatus).map((status) => ({
    label: labels.transactionStatus(status),
    value: status,
  }));

  return (
    <FieldGroup>
      <form.Field name="kind">
        {(field) => {
          const showErrors =
            field.state.meta.isTouched && !field.state.meta.isValid;
          const errorId = `${field.name}-error`;

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>
                {t("transaction.filter.kind")}
              </FieldLabel>
              <Select
                items={kindItems}
                id={field.name}
                name={field.name}
                value={field.state.value}
                onValueChange={(value) => {
                  field.handleChange(value as TransactionFormKind);
                  form.setFieldValue("categoryId", null);
                }}
              >
                <SelectTrigger
                  aria-invalid={showErrors || undefined}
                  aria-describedby={showErrors ? errorId : undefined}
                >
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
              <FieldError
                id={errorId}
                errors={showErrors ? field.state.meta.errors : []}
              />
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="name">
        {(field) => {
          const showErrors =
            field.state.meta.isTouched && !field.state.meta.isValid;
          const errorId = `${field.name}-error`;

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
        <AmountField form={form} />
        <DateField form={form} />
      </FieldRow>

      <FieldRow>
        <WalletField form={form} />
        <CategoryField form={form} />
      </FieldRow>

      <form.Field name="status">
        {(field) => {
          const showErrors =
            field.state.meta.isTouched && !field.state.meta.isValid;
          const errorId = `${field.name}-error`;

          return (
            <Field data-invalid={showErrors}>
              <FieldLabel htmlFor={field.name}>{t("common.status")}</FieldLabel>
              <Select
                items={statusItems}
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
                  {statusItems.map((item) => (
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
              <FieldLabel htmlFor={field.name}>{t("common.notes")}</FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                rows={3}
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

      {children}
    </FieldGroup>
  );
}
