import {
  matchImportRows,
  revalidateImportRow,
  type ImportCsvRow,
  type ImportMatchOptions,
  type ImportRowDraft,
} from "@budget-manager/client";
import {
  useCategoryOptionsQuery,
  useCreditCardOptionsQuery,
  usePreferredCurrency,
  useWalletOptionsQuery,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { useMemo, useState } from "react";
import { View } from "react-native";

import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { ImportReviewRows } from "@/modules/transaction/components/import/import-review-rows";
import { ImportUploadCard } from "@/modules/transaction/components/import/import-upload-card";
import { SPACING } from "@/theme/tokens";

/**
 * Two steps on one pushed screen: choose a file, then review it row by row. The
 * parsed rows live in memory — they would not survive a navigation anyway — so
 * "which step" is simply whether a file has been read into drafts yet, and nothing
 * is written until the reader confirms the whole list.
 *
 * No page title: `PushedHeader` above already says what this screen is.
 */
export function ImportTransactionsScreen() {
  const t = useTranslate();
  const { data: wallets } = useWalletOptionsQuery();
  const { data: cards } = useCreditCardOptionsQuery();
  const { data: categories } = useCategoryOptionsQuery();
  const preferredCurrency = usePreferredCurrency();
  const [drafts, setDrafts] = useState<ImportRowDraft[] | null>(null);

  const options = useMemo<ImportMatchOptions>(
    () => ({
      wallets: wallets ?? [],
      cards: cards ?? [],
      categories: categories ?? [],
      fallbackCurrencyCode: preferredCurrency,
    }),
    [wallets, cards, categories, preferredCurrency],
  );

  // Every edit funnels through the one shared validator, so an issue can never
  // outlive the field it names — the review screen's "one validation cause".
  function updateRow(key: number, patch: Partial<ImportRowDraft>) {
    setDrafts(
      (current) =>
        current?.map((draft) =>
          draft.key === key
            ? revalidateImportRow({ ...draft, ...patch }, options)
            : draft,
        ) ?? current,
    );
  }

  function removeRow(key: number) {
    setDrafts(
      (current) => current?.filter((draft) => draft.key !== key) ?? current,
    );
  }

  return (
    <Screen>
      <View style={{ paddingTop: SPACING.md }}>
        <Text variant="meta" tone="muted">
          {t("transaction.import.description")}
        </Text>
      </View>

      {drafts === null ? (
        <ImportUploadCard
          onRows={(rows: ImportCsvRow[]) =>
            setDrafts(matchImportRows(rows, options))
          }
        />
      ) : (
        <ImportReviewRows
          drafts={drafts}
          options={options}
          onUpdateRow={updateRow}
          onRemoveRow={removeRow}
          onBack={() => setDrafts(null)}
        />
      )}
    </Screen>
  );
}
