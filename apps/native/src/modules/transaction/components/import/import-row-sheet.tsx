import {
  cardAccountValue,
  importRowCurrency,
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
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import {
  TRANSACTION_FORM_KINDS,
  type TransactionFormKind,
} from "@budget-manager/schemas";
import { useState } from "react";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldGroup, FieldRow } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { useCategoryItems } from "@/modules/category/components/category-items";
import {
  expectedCategoryType,
  useImportIssueMessage,
} from "@/modules/transaction/components/import/issue-message";
import { SPACING } from "@/theme/tokens";

const ACCOUNT_ISSUES: ImportRowIssue[] = [
  "missingAccount",
  "unknownAccount",
  "ambiguousAccount",
];

const CATEGORY_ISSUES: ImportRowIssue[] = [
  "unknownCategory",
  "ambiguousCategory",
];

/**
 * One CSV line, correctable. This is where the web's six table columns went: a phone
 * cannot show them per row, so the row states what it will create and this sheet is
 * where it is put right — every field the file supplied, the issues named in full,
 * and the row's own removal.
 *
 * Nothing here validates on its own. Every edit goes up through `onUpdate`, which
 * re-runs the shared `revalidateImportRow`, so an issue can never outlive the field
 * it names and fixing the type resolves the category by itself. That is also why this
 * is not a TanStack form: the draft list is the state and the shared validator is the
 * one cause, exactly as on the web.
 */
export function ImportRowSheet({
  draft,
  number,
  options,
  onUpdate,
  onRemove,
  onClose,
}: {
  draft: ImportRowDraft;
  number: number;
  options: ImportMatchOptions;
  onUpdate: (patch: Partial<ImportRowDraft>) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const issueMessage = useImportIssueMessage();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const { data: categories } = useCategoryOptionsQuery();

  const has = (issue: ImportRowIssue) => draft.issues.includes(issue);

  const kindItems = TRANSACTION_FORM_KINDS.map((kind) => ({
    label: labels.transactionKind(kind),
    value: kind,
  }));

  // Wallets and cards come from different tables, so the value is prefixed and
  // `parseAccountValue` splits it back apart.
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

  const accountValue = draft.account
    ? draft.account.kind === "card"
      ? cardAccountValue(draft.account.id)
      : walletAccountValue(draft.account.id)
    : "";

  const categoryType = expectedCategoryType(draft);
  const categoryItems = useCategoryItems(
    (categories ?? []).filter((category) => category.type === categoryType),
  );

  const currencyCode = importRowCurrency(draft.account, options);
  const accountInvalid = draft.issues.some((issue) =>
    ACCOUNT_ISSUES.includes(issue),
  );
  const categoryInvalid = draft.issues.some((issue) =>
    CATEGORY_ISSUES.includes(issue),
  );
  const typeInvalid = has("invalidType") || has("cardRowIncome");

  return (
    <>
      <Sheet
        // Derived, never a prop the screen owns: this component has to stay mounted
        // to hold the confirmation it just opened.
        open={!confirmingRemove}
        onClose={onClose}
        title={t("transaction.import.review.rowNumber", { number })}
        description={draft.name || undefined}
        footer={
          <Button
            label={t("transaction.import.review.done")}
            onPress={onClose}
            style={{ flex: 1 }}
          />
        }
      >
        <FieldGroup>
          <Field label={t("common.description")}>
            <Input
              value={draft.name}
              invalid={has("missingDescription")}
              accessibilityLabel={t("common.description")}
              onChangeText={(name) => onUpdate({ name })}
            />
          </Field>

          <FieldRow>
            <Field label={t("common.amount")}>
              <CurrencyInput
                value={draft.amountCents ?? 0}
                currencyCode={currencyCode ?? "BRL"}
                invalid={has("invalidAmount")}
                accessibilityLabel={t("common.amount")}
                onValueChange={(amountCents) =>
                  onUpdate({ amountCents, amountEdited: true })
                }
              />
            </Field>

            <Field label={t("common.date")}>
              <DatePicker
                label={t("common.date")}
                value={draft.occurrenceDate ?? ""}
                invalid={has("invalidDate")}
                onValueChange={(occurrenceDate) => onUpdate({ occurrenceDate })}
              />
            </Field>
          </FieldRow>

          <Field label={t("common.type")}>
            <Select
              label={t("common.type")}
              items={kindItems}
              value={draft.kind ?? ""}
              placeholder={t("common.type")}
              invalid={typeInvalid}
              onValueChange={(value) =>
                onUpdate({ kind: value ? (value as TransactionFormKind) : null })
              }
            />
          </Field>

          <Field label={t("common.account")}>
            <Select
              label={t("common.account")}
              items={accountItems}
              value={accountValue}
              placeholder={t("common.account")}
              invalid={accountInvalid}
              onValueChange={(value) =>
                onUpdate({
                  account: toAccountRef(value),
                  accountEdited: true,
                })
              }
            />
          </Field>

          <Field label={t("common.category")}>
            <Select
              label={t("common.category")}
              items={categoryItems}
              value={draft.categoryId ?? TRANSACTION_CATEGORY_NONE}
              disabled={categoryType === null}
              invalid={categoryInvalid}
              onValueChange={(value) => {
                // An empty value is the primitive dropping a choice that left its
                // own items, not a pick — so it must not mark the field edited, or
                // the file's own category would stop being re-matched.
                if (!value) {
                  onUpdate({ categoryId: null });

                  return;
                }

                onUpdate({
                  categoryId:
                    value === TRANSACTION_CATEGORY_NONE ? null : value,
                  categoryEdited: true,
                });
              }}
            />
          </Field>
        </FieldGroup>

        {draft.issues.length > 0 ? (
          <View style={{ gap: SPACING.xs }}>
            <Text variant="eyebrow" tone="destructive">
              {t("transaction.import.review.rowIssuesTitle")}
            </Text>
            {draft.issues.map((issue) => (
              <Text key={issue} variant="meta" tone="destructive">
                {issueMessage(draft, issue)}
              </Text>
            ))}
          </View>
        ) : null}

        <Button
          variant="destructive"
          label={t("transaction.import.review.removeRow", { number })}
          onPress={() => setConfirmingRemove(true)}
        />
      </Sheet>

      {/* Reversible only by uploading the file again, so it is confirmed like every
          other destructive action — and the confirmation replaces the sheet rather
          than stacking on it. */}
      <ConfirmSheet
        open={confirmingRemove}
        onOpenChange={setConfirmingRemove}
        title={t("transaction.import.review.removeConfirm.title")}
        description={t("transaction.import.review.removeConfirm.description")}
        confirmLabel={t("transaction.import.review.removeConfirm.submit")}
        onConfirm={() => {
          setConfirmingRemove(false);
          onRemove();
        }}
      />
    </>
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
