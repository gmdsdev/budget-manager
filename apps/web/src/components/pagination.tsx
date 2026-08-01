import { PAGE_SIZE, pageCount, pageRange } from "@/lib/pagination";
import { useTranslate } from "@budget-manager/i18n/react";
import { Button } from "@budget-manager/ui/components/button";

/**
 * The row count is named per resource rather than by interpolating a noun into
 * one sentence: "No {label}" needs an article in Portuguese, and the article
 * follows the noun's gender ("Nenhuma carteira" but "Nenhum cartão"), so a
 * single parameterised message cannot be written correctly for both languages.
 */
export type PaginatedResource =
  | "wallets"
  | "categories"
  | "cards"
  | "transactions"
  | "budgets"
  | "statements";

export function Pagination({
  page,
  total,
  pageSize = PAGE_SIZE,
  onPageChange,
  resource,
  isFetching,
}: {
  page: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  /** Which rows are being counted, for the summary message. */
  resource: PaginatedResource;
  isFetching?: boolean;
}) {
  const t = useTranslate();
  const pages = pageCount(total, pageSize);
  const { from, to } = pageRange({ page, total, pageSize });

  // A single page needs no controls, but the count is still worth stating.
  const showControls = pages > 1;

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-4 py-3">
      <p
        className="text-xs text-muted-foreground"
        aria-live="polite"
        data-testid="pagination-summary"
      >
        {total === 0
          ? t(`pagination.${resource}.empty`)
          : t(`pagination.${resource}.summary`, { from, to, total })}
      </p>

      {showControls && (
        <div className="flex flex-row items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => onPageChange(page - 1)}
          >
            {t("pagination.previous")}
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            {t("pagination.pageOf", { page, pages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages || isFetching}
            onClick={() => onPageChange(page + 1)}
          >
            {t("pagination.next")}
          </Button>
        </div>
      )}
    </div>
  );
}
