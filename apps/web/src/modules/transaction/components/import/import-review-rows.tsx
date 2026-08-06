import {
  CategoryItemLabel,
  CategoryLabel,
  type CategoryItem,
} from "@/modules/category/components/category-dot";
import {
  cardAccountValue,
  importRowCurrency,
  importRowsInput,
  parseAccountValue,
  TRANSACTION_CATEGORY_NONE,
  walletAccountValue,
  type ImportMatchOptions,
  type ImportRowDraft,
  type ImportRowIssue,
} from "@budget-manager/client";
import {
  useCategoryOptionsQuery,
  useEnumLabels,
  useImportTransactionsMutation,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import {
  CategoryType,
  TRANSACTION_FORM_KINDS,
  TransactionKind,
  type TransactionFormKind,
} from "@budget-manager/schemas";
import { Button } from "@budget-manager/ui/components/button";
import { CurrencyInput } from "@budget-manager/ui/components/currency-input";
import { DatePicker } from "@budget-manager/ui/components/date-picker";
import { Empty, EmptyDescription, EmptyHeader } from "@budget-manager/ui/components/empty";
import { Field, FieldLabel } from "@budget-manager/ui/components/field";
import { Input } from "@budget-manager/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@budget-manager/ui/components/select";
import { TrashIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";

const KIND_TO_CATEGORY_TYPE: Record<TransactionFormKind, CategoryType> = {
  [TransactionKind.INCOME]: CategoryType.INCOME,
  [TransactionKind.EXPENSE]: CategoryType.EXPENSE,
};

const ACCOUNT_ISSUES: ImportRowIssue[] = [
  "missingAccount",
  "unknownAccount",
  "ambiguousAccount",
];

const CATEGORY_ISSUES: ImportRowIssue[] = [
  "unknownCategory",
  "ambiguousCategory",
];

function expectedCategoryType(draft: ImportRowDraft): CategoryType | null {
  if (draft.account?.kind === "card") {
    return CategoryType.EXPENSE;
  }

  return draft.kind ? KIND_TO_CATEGORY_TYPE[draft.kind] : null;
}

/**
 * Step two: every parsed line as an editable row. Nothing here validates on
 * its own — edits go up through `onUpdateRow`, which re-runs the shared
 * validator, and the submit stays blocked while any issue remains (the
 * all-or-nothing rule, with the count beside the button saying why).
 */
export function ImportReviewRows({
  drafts,
  options,
  onUpdateRow,
  onRemoveRow,
  onBack,
}: {
  drafts: ImportRowDraft[];
  options: ImportMatchOptions;
  onUpdateRow: (key: number, patch: Partial<ImportRowDraft>) => void;
  onRemoveRow: (key: number) => void;
  onBack: () => void;
}) {
  const t = useTranslate();
  const navigate = useNavigate();
  const importMutation = useImportTransactionsMutation();

  const issueCount = drafts.filter((draft) => draft.issues.length > 0).length;
  const canSubmit = drafts.length > 0 && issueCount === 0;

  function submit() {
    importMutation.mutate(importRowsInput(drafts), {
      onSuccess: () => void navigate({ to: "/transaction" }),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.015em]">
          {t("transaction.import.review.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("transaction.import.review.description")}
        </p>
      </div>

      {drafts.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyDescription>
              {t("transaction.import.review.empty")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {drafts.map((draft, index) => (
            <ImportReviewRow
              key={draft.key}
              draft={draft}
              number={index + 1}
              options={options}
              onUpdate={(patch) => onUpdateRow(draft.key, patch)}
              onRemove={() => onRemoveRow(draft.key)}
            />
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={onBack}>
          {t("transaction.import.review.back")}
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="text-sm text-muted-foreground"
            role="status"
          >
            {issueCount > 0
              ? t("transaction.import.review.issues", {
                  count: issueCount,
                  total: drafts.length,
                })
              : t("transaction.import.review.ready", {
                  total: drafts.length,
                })}
          </span>
          <Button
            disabled={!canSubmit || importMutation.isPending}
            onClick={submit}
          >
            {importMutation.isPending
              ? t("transaction.import.review.submitting")
              : t("transaction.import.review.submit", {
                  count: drafts.length,
                })}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ImportReviewRow({
  draft,
  number,
  options,
  onUpdate,
  onRemove,
}: {
  draft: ImportRowDraft;
  number: number;
  options: ImportMatchOptions;
  onUpdate: (patch: Partial<ImportRowDraft>) => void;
  onRemove: () => void;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const { data: categories } = useCategoryOptionsQuery();

  const has = (issue: ImportRowIssue) => draft.issues.includes(issue);

  const kindItems = TRANSACTION_FORM_KINDS.map((kind) => ({
    label: labels.transactionKind(kind),
    value: kind,
  }));

  const accountValue = draft.account
    ? draft.account.kind === "card"
      ? cardAccountValue(draft.account.id)
      : walletAccountValue(draft.account.id)
    : null;

  const accountItems = [
    ...options.wallets.map((wallet) => ({
      label: wallet.name,
      value: walletAccountValue(wallet.id),
    })),
    ...options.cards.map((card) => ({
      label: card.name,
      value: cardAccountValue(card.id),
    })),
  ];

  const categoryType = expectedCategoryType(draft);

  const categoryItems: CategoryItem[] = [
    {
      label: t("category.uncategorized"),
      value: TRANSACTION_CATEGORY_NONE,
      color: null,
    },
    ...(categories ?? [])
      .filter((category) => category.type === categoryType)
      .map((category) => ({
        label: category.name,
        value: category.id,
        color: category.color,
      })),
  ];

  const currencyCode = importRowCurrency(draft.account, options);
  const accountInvalid = draft.issues.some((issue) =>
    ACCOUNT_ISSUES.includes(issue),
  );
  const categoryInvalid = draft.issues.some((issue) =>
    CATEGORY_ISSUES.includes(issue),
  );
  const typeInvalid = has("invalidType") || has("cardRowIncome");
  const fieldId = (name: string) => `import-row-${draft.key}-${name}`;

  return (
    <li className="rounded-xl border bg-card p-4 dark:border-transparent">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-[0.02em] uppercase text-muted-foreground">
          {t("transaction.import.review.rowNumber", { number })}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("transaction.import.review.removeRow", { number })}
          onClick={onRemove}
        >
          <TrashIcon aria-hidden />
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <Field data-invalid={has("missingDescription")}>
          <FieldLabel htmlFor={fieldId("description")}>
            {t("common.description")}
          </FieldLabel>
          <Input
            id={fieldId("description")}
            type="text"
            value={draft.name}
            aria-invalid={has("missingDescription") || undefined}
            onChange={(event) => onUpdate({ name: event.target.value })}
          />
        </Field>

        <Field data-invalid={has("invalidAmount")}>
          <FieldLabel htmlFor={fieldId("amount")}>
            {t("common.amount")}
          </FieldLabel>
          <CurrencyInput
            id={fieldId("amount")}
            value={draft.amountCents ?? 0}
            currencyCode={currencyCode ?? "BRL"}
            aria-invalid={has("invalidAmount") || undefined}
            onValueChange={(value) =>
              onUpdate({ amountCents: value, amountEdited: true })
            }
          />
        </Field>

        <Field data-invalid={has("invalidDate")}>
          <FieldLabel htmlFor={fieldId("date")}>{t("common.date")}</FieldLabel>
          <DatePicker
            id={fieldId("date")}
            value={draft.occurrenceDate}
            aria-invalid={has("invalidDate") || undefined}
            onValueChange={(value) => onUpdate({ occurrenceDate: value })}
          />
        </Field>

        <Field data-invalid={typeInvalid}>
          <FieldLabel htmlFor={fieldId("type")}>{t("common.type")}</FieldLabel>
          <Select
            items={kindItems}
            id={fieldId("type")}
            value={draft.kind}
            onValueChange={(value) => onUpdate({ kind: value })}
          >
            <SelectTrigger
              className="w-full"
              aria-invalid={typeInvalid || undefined}
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
        </Field>

        <Field data-invalid={categoryInvalid}>
          <FieldLabel htmlFor={fieldId("category")}>
            {t("common.category")}
          </FieldLabel>
          <Select
            items={categoryItems}
            id={fieldId("category")}
            value={draft.categoryId ?? TRANSACTION_CATEGORY_NONE}
            disabled={categoryType === null}
            onValueChange={(value) =>
              onUpdate({
                categoryId: value === TRANSACTION_CATEGORY_NONE ? null : value,
                categoryEdited: true,
              })
            }
          >
            <SelectTrigger
              className="w-full"
              aria-invalid={categoryInvalid || undefined}
            >
              <SelectValue>
                {(selected: string) => (
                  <CategoryItemLabel items={categoryItems} value={selected} />
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
        </Field>

        <Field data-invalid={accountInvalid}>
          <FieldLabel htmlFor={fieldId("account")}>
            {t("common.account")}
          </FieldLabel>
          <Select
            items={accountItems}
            id={fieldId("account")}
            value={accountValue}
            onValueChange={(value) =>
              onUpdate({
                account: toAccountRef(value as string),
                accountEdited: true,
              })
            }
          >
            <SelectTrigger
              className="w-full"
              aria-invalid={accountInvalid || undefined}
            >
              <SelectValue placeholder={t("common.account")} />
            </SelectTrigger>
            <SelectContent>
              {options.wallets.length > 0 ? (
                <SelectGroup>
                  <SelectLabel>{t("nav.wallets")}</SelectLabel>
                  {options.wallets.map((wallet) => (
                    <SelectItem
                      key={wallet.id}
                      value={walletAccountValue(wallet.id)}
                    >
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : null}
              {options.cards.length > 0 ? (
                <SelectGroup>
                  <SelectLabel>{t("nav.creditCards")}</SelectLabel>
                  {options.cards.map((card) => (
                    <SelectItem key={card.id} value={cardAccountValue(card.id)}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : null}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {draft.issues.length > 0 ? (
        <ul role="alert" className="mt-3 flex flex-col gap-1 text-sm text-destructive">
          {draft.issues.map((issue) => (
            <li key={issue}>{issueMessage(t, draft, issue)}</li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function toAccountRef(value: string): ImportRowDraft["account"] {
  const { walletId, creditCardId } = parseAccountValue(value);

  if (walletId) {
    return { kind: "wallet", id: walletId };
  }

  if (creditCardId) {
    return { kind: "card", id: creditCardId };
  }

  return null;
}

function issueMessage(
  t: ReturnType<typeof useTranslate>,
  draft: ImportRowDraft,
  issue: ImportRowIssue,
): string {
  switch (issue) {
    case "missingDescription":
      return t("transaction.import.issue.missingDescription");
    case "invalidAmount":
      return t("transaction.import.issue.invalidAmount");
    case "invalidType":
      return t("transaction.import.issue.invalidType");
    case "invalidDate":
      return t("transaction.import.issue.invalidDate");
    case "missingAccount":
      return t("transaction.import.issue.missingAccount");
    case "unknownAccount":
      return t("transaction.import.issue.unknownAccount", {
        name: draft.rawAccount,
      });
    case "ambiguousAccount":
      return t("transaction.import.issue.ambiguousAccount", {
        name: draft.rawAccount,
      });
    case "unknownCategory":
      return t("transaction.import.issue.unknownCategory", {
        name: draft.rawCategory,
        type:
          expectedCategoryType(draft) === CategoryType.INCOME
            ? t("enum.categoryType.income.inline")
            : t("enum.categoryType.expense.inline"),
      });
    case "ambiguousCategory":
      return t("transaction.import.issue.ambiguousCategory", {
        name: draft.rawCategory,
      });
    case "cardRowIncome":
      return t("transaction.import.issue.cardRowIncome");
  }
}
