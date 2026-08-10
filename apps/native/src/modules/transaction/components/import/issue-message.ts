import type { ImportRowDraft, ImportRowIssue } from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";
import {
  CategoryType,
  TransactionKind,
  type TransactionFormKind,
} from "@budget-manager/schemas";

const KIND_TO_CATEGORY_TYPE: Record<TransactionFormKind, CategoryType> = {
  [TransactionKind.INCOME]: CategoryType.INCOME,
  [TransactionKind.EXPENSE]: CategoryType.EXPENSE,
};

/**
 * A card row is always a purchase, so the category it may carry is an expense one
 * whatever the file's type column said.
 */
export function expectedCategoryType(draft: ImportRowDraft): CategoryType | null {
  if (draft.account?.kind === "card") {
    return CategoryType.EXPENSE;
  }

  return draft.kind ? KIND_TO_CATEGORY_TYPE[draft.kind] : null;
}

/**
 * An issue names the cell it came from, which is why the message needs the draft as
 * well as the issue. Both the row list and the row's own sheet state them, so the
 * mapping lives beside them rather than inside one of the two.
 */
export function useImportIssueMessage() {
  const t = useTranslate();

  return function issueMessage(
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
  };
}
