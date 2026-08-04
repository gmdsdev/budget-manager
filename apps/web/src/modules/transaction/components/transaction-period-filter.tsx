import { useTranslate } from "@budget-manager/i18n/react";
import { Button } from "@budget-manager/ui/components/button";
import { DateRangePicker } from "@budget-manager/ui/components/date-picker";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import {
  shiftDateRange,
  type TransactionFiltersState,
} from "@budget-manager/client";

/**
 * The period the ledger is scoped to, in the page header beside the create
 * action rather than down in the filter bar — the same grammar the budget screen
 * reads in, where the month sits above everything it scopes.
 *
 * The arrows flank the range because they move it: one click is the same period
 * again, forward or back — a month for a month, a week for a week, and its own
 * length in days for anything drawn by hand. Neither is disabled, since the
 * ledger reaches into the future a series has already been written into.
 */
export function TransactionPeriodFilter({
  filters,
  onFiltersChange,
}: {
  filters: TransactionFiltersState;
  onFiltersChange: (filters: TransactionFiltersState) => void;
}) {
  const t = useTranslate();

  function step(direction: 1 | -1) {
    const { from, to } = shiftDateRange(
      { from: filters.dateFrom, to: filters.dateTo },
      direction,
    );

    onFiltersChange({ ...filters, dateFrom: from, dateTo: to });
  }

  return (
    <div className="flex flex-1 flex-row items-center gap-1 sm:flex-none">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={t("common.previousPeriod")}
        onClick={() => step(-1)}
      >
        <CaretLeftIcon aria-hidden />
      </Button>

      <DateRangePicker
        id="transaction-date-range-filter"
        aria-label={t("transaction.filter.dateRange")}
        size="sm"
        // Sized to its content above sm, not pinned: a formatted range is far
        // longer in some languages than in English ("1 de jul. – 31 de jul. de
        // 2026"), and a fixed width clipped it.
        className="flex-1 rounded-full sm:w-auto sm:min-w-44 sm:flex-none"
        value={{ from: filters.dateFrom, to: filters.dateTo }}
        onValueChange={({ from, to }) =>
          onFiltersChange({ ...filters, dateFrom: from, dateTo: to })
        }
      />

      <Button
        variant="outline"
        size="icon-sm"
        aria-label={t("common.nextPeriod")}
        onClick={() => step(1)}
      >
        <CaretRightIcon aria-hidden />
      </Button>
    </div>
  );
}
