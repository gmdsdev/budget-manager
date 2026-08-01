import type { Translate } from "@budget-manager/i18n";
import { RecurrenceType, type BudgetRecurrenceType } from "@budget-manager/schemas";

/**
 * How a schedule reads in a table cell. A fixed budget is the one shape that
 * carries a bound of its own, which is why it is the only one showing a count.
 */
export function repeatsLabel(
  t: Translate,
  {
    recurrenceType,
    interval,
    installments,
  }: {
    recurrenceType: BudgetRecurrenceType;
    interval: number;
    installments: number | null;
  },
) {
  if (recurrenceType === RecurrenceType.FIXED) {
    return t("budget.repeats.fixed", { count: installments ?? 0 });
  }

  if (recurrenceType === RecurrenceType.YEARLY) {
    return interval === 1
      ? t("budget.repeats.everyYear")
      : t("budget.repeats.everyYears", { count: interval });
  }

  return interval === 1
    ? t("budget.repeats.everyMonth")
    : t("budget.repeats.everyMonths", { count: interval });
}
