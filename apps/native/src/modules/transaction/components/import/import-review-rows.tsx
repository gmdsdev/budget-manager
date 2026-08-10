import {
  importRowCurrency,
  importRowsInput,
  PAGE_SIZE,
  pageCount,
  type ImportMatchOptions,
  type ImportRowDraft,
} from "@budget-manager/client";
import {
  useCategoryOptionsQuery,
  useImportTransactionsMutation,
} from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { TransactionKind } from "@budget-manager/schemas";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Fragment, useState } from "react";
import { View } from "react-native";

import {
  RecordGlyph,
  RecordList,
  RecordRow,
  RecordTag,
} from "@/components/record-row";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Pagination } from "@/components/ui/pagination";
import { Text } from "@/components/ui/text";
import { categoryColorOrNeutral } from "@/modules/category/colors";
import { ImportRowSheet } from "@/modules/transaction/components/import/import-row-sheet";
import { useImportIssueMessage } from "@/modules/transaction/components/import/issue-message";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

/** The glyph's own width and gutters, so an issue line starts where the name does. */
const ROW_TEXT_INSET = SPACING.md + 44 + SPACING.md;

/**
 * Step two: every parsed line as a reviewable record. The web lays this out as a
 * table of six editable columns per row, which a phone cannot hold — so a row here
 * states **what it will create** (its description, its date, category and account,
 * its amount) and whether it will import at all, and the row opens the sheet where
 * it is corrected. The same shape every other listing in this app takes.
 *
 * Three things a reviewer has to be able to do without scrolling, and where each
 * one lives:
 *
 * - **See how many rows will fail.** The two chips above the list carry both counts,
 *   and filtering to the failing ones is what makes three bad rows in five hundred
 *   findable at all — paging through them is not reviewing them.
 * - **Tell a failing row from a passing one at a glance.** A red alert glyph and a
 *   `Fix` tag rather than the category's own hue and a `Ready` tag, with the issues
 *   named in words directly beneath the row. Nothing is silently dropped: an invalid
 *   row stays in the list, in file order, keeping the row number the file has.
 * - **Know why the import is blocked.** The sentence above the submit button, which
 *   is the one place the all-or-nothing rule is stated.
 *
 * Rows are paged with the shared `PAGE_SIZE`, because a file may carry
 * `IMPORT_MAX_ROWS` of them and five hundred rows in one scroll view is not a list.
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
  const { t, formatDateString } = useI18n();
  const router = useRouter();
  const colors = useColors();
  const issueMessage = useImportIssueMessage();
  const importMutation = useImportTransactionsMutation();
  const { data: categories } = useCategoryOptionsQuery();
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState<number | null>(null);

  const issueCount = drafts.filter((draft) => draft.issues.length > 0).length;
  const canSubmit = drafts.length > 0 && issueCount === 0;

  // The filter falls back to every row the moment the last failing one is fixed,
  // rather than leaving the reader on an empty list wondering what happened.
  const filtering = onlyIssues && issueCount > 0;
  const shown = filtering
    ? drafts.filter((draft) => draft.issues.length > 0)
    : drafts;

  // Removing rows shrinks the list under the reader's feet, so the page is clamped
  // rather than remembered.
  const pages = Math.max(pageCount(shown.length, PAGE_SIZE), 1);
  const currentPage = Math.min(page, pages);
  const pageRows = shown.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const selected = drafts.find((draft) => draft.key === selectedKey) ?? null;

  function submit() {
    importMutation.mutate(importRowsInput(drafts), {
      // Back to the ledger, where the imported rows now are.
      onSuccess: () => router.replace("/transaction"),
    });
  }

  return (
    <View style={{ gap: SPACING.lg }}>
      <View style={{ gap: SPACING.xs }}>
        <Text variant="cardTitle">{t("transaction.import.review.title")}</Text>
        <Text variant="meta" tone="muted">
          {t("transaction.import.review.description")}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: SPACING.sm }}>
        <Button
          variant={filtering ? "outline" : "secondary"}
          size="sm"
          label={t("transaction.import.review.filterAll", {
            count: drafts.length,
          })}
          style={{ flex: 1 }}
          onPress={() => {
            setOnlyIssues(false);
            setPage(1);
          }}
        />
        <Button
          variant={filtering ? "secondary" : "outline"}
          size="sm"
          label={t("transaction.import.review.filterIssues", {
            count: issueCount,
          })}
          disabled={issueCount === 0}
          style={{ flex: 1 }}
          onPress={() => {
            setOnlyIssues(true);
            setPage(1);
          }}
        />
      </View>

      {drafts.length === 0 ? (
        <Empty title={t("transaction.import.review.empty")} />
      ) : (
        <>
          <RecordList label={t("transaction.import.review.title")}>
            {pageRows.map((draft) => {
              const number = drafts.indexOf(draft) + 1;
              const invalid = draft.issues.length > 0;
              const category = (categories ?? []).find(
                (option) => option.id === draft.categoryId,
              );
              const isCard = draft.account?.kind === "card";
              const isIncome = draft.kind === TransactionKind.INCOME && !isCard;
              const currencyCode = importRowCurrency(draft.account, options);
              const ink = invalid
                ? colors.destructive
                : categoryColorOrNeutral(colors, category?.color ?? null);

              return (
                <Fragment key={draft.key}>
                  <RecordRow
                    label={t("transaction.import.review.editRow", { number })}
                    onSelect={() => setSelectedKey(draft.key)}
                    glyph={
                      <RecordGlyph color={ink}>
                        <Feather
                          name={
                            invalid
                              ? "alert-triangle"
                              : isCard
                                ? "credit-card"
                                : isIncome
                                  ? "arrow-down"
                                  : "arrow-up"
                          }
                          size={20}
                          color={ink}
                        />
                      </RecordGlyph>
                    }
                    primary={
                      draft.name ||
                      t("transaction.import.review.rowNumber", { number })
                    }
                    // What the row will create, in the order the ledger states it:
                    // when a cell could not be read the file's own text stands in, so
                    // a value is never simply missing from the row.
                    meta={[
                      draft.occurrenceDate
                        ? formatDateString(draft.occurrenceDate, "day")
                        : draft.rawDate || t("common.none"),
                      category?.name ??
                        (draft.rawCategory || t("category.uncategorized")),
                      accountName(draft, options),
                    ]}
                    tag={
                      <RecordTag tone={invalid ? "negative" : "positive"}>
                        {invalid
                          ? t("transaction.import.review.rowIssues")
                          : t("transaction.import.review.rowReady")}
                      </RecordTag>
                    }
                    trailing={
                      draft.amountCents !== null && currencyCode ? (
                        <Text
                          variant="figureRow"
                          tone={isIncome ? "success" : "default"}
                          style={{ fontVariant: ["tabular-nums"] }}
                        >
                          {`${isIncome ? "+" : "−"}${formatMinorUnits(
                            draft.amountCents,
                            currencyCode,
                          )}`}
                        </Text>
                      ) : (
                        <Text variant="metaMedium" tone="muted">
                          {draft.rawAmount || t("common.none")}
                        </Text>
                      )
                    }
                  />

                  {invalid ? (
                    <View
                      style={{
                        paddingLeft: ROW_TEXT_INSET,
                        paddingRight: SPACING.md,
                        paddingBottom: SPACING.sm,
                        gap: 2,
                      }}
                    >
                      {draft.issues.map((issue) => (
                        <Text key={issue} variant="meta" tone="destructive">
                          {issueMessage(draft, issue)}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </Fragment>
              );
            })}
          </RecordList>

          <Pagination
            page={currentPage}
            total={shown.length}
            onPageChange={setPage}
            resource="transactions"
          />
        </>
      )}

      <View style={{ gap: SPACING.sm }}>
        <Text variant="meta" tone="muted" accessibilityLiveRegion="polite">
          {issueCount > 0
            ? t("transaction.import.review.issues", {
                count: issueCount,
                total: drafts.length,
              })
            : t("transaction.import.review.ready", { total: drafts.length })}
        </Text>
        {/* Disabled while any row would fail — the sentence above it is what says
            why, which is the whole reason that rule has an exception here. */}
        <Button
          label={
            importMutation.isPending
              ? t("transaction.import.review.submitting")
              : t("transaction.import.review.submit", { count: drafts.length })
          }
          disabled={!canSubmit}
          loading={importMutation.isPending}
          onPress={submit}
        />
        <Button
          variant="outline"
          label={t("transaction.import.review.back")}
          onPress={onBack}
        />
      </View>

      {/* Keyed on the row, so opening a different one rebuilds the sheet rather than
          carrying the previous row's confirmation state over. */}
      {selected && (
        <ImportRowSheet
          key={selected.key}
          draft={selected}
          number={drafts.indexOf(selected) + 1}
          options={options}
          onUpdate={(patch) => onUpdateRow(selected.key, patch)}
          onRemove={() => {
            onRemoveRow(selected.key);
            setSelectedKey(null);
          }}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </View>
  );
}

/** The account the row will land in, or the name the file gave that matched nothing. */
function accountName(draft: ImportRowDraft, options: ImportMatchOptions) {
  if (draft.account) {
    const list =
      draft.account.kind === "wallet" ? options.wallets : options.cards;

    return (
      list.find((item) => item.id === draft.account?.id)?.name ??
      draft.rawAccount
    );
  }

  return draft.rawAccount;
}
