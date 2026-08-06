import { PageHeader } from "@/components/page-header";
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
import { buttonVariants } from "@budget-manager/ui/components/button";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ImportReviewRows } from "../components/import/import-review-rows";
import { ImportUploadCard } from "../components/import/import-upload-card";

/**
 * Two steps in one route: upload, then review. The parsed rows live in memory
 * — they would not survive a navigation anyway — so "which step" is simply
 * whether a file has been read into drafts yet.
 */
export default function ImportTransactionsPage() {
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

  // Every edit funnels through the one validator, so an issue can never
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
    <div className="pb-8">
      <PageHeader
        title={t("transaction.import.title")}
        description={t("transaction.import.description")}
      >
        <Link
          to="/transaction"
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeftIcon aria-hidden />
          {t("transaction.import.back")}
        </Link>
      </PageHeader>

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
    </div>
  );
}
