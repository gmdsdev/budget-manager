import { PAGE_SIZE, pageCount, pageRange } from "@/lib/pagination";
import { Button } from "@budget-manager/ui/components/button";

export function Pagination({
  page,
  total,
  pageSize = PAGE_SIZE,
  onPageChange,
  label,
  isFetching,
}: {
  page: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  /** Plural noun for the row count, e.g. "transactions". */
  label: string;
  isFetching?: boolean;
}) {
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
          ? `No ${label}`
          : `Showing ${from}–${to} of ${total} ${label}`}
      </p>

      {showControls && (
        <div className="flex flex-row items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages || isFetching}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
