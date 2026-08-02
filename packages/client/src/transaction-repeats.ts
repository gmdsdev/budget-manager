import type { Translate } from "@budget-manager/i18n";
import { RecurrenceType, TransactionRepeats } from "@budget-manager/schemas";

import type { EnumLabels } from "./enum-labels";

/**
 * How a row's provenance reads: `One-off`, `Monthly`, `6× monthly`. A `fixed` series is
 * the one shape that carries a bound of its own, which is why it is the only one showing
 * a count — and a row whose series was deleted correctly reads as one-off, because
 * `template_id` is `ON DELETE SET NULL`.
 */
export function transactionRepeatsLabel(
  t: Translate,
  labels: EnumLabels,
  row: {
    recurrenceType: string | null;
    recurrenceInterval: number | null;
    recurrenceInstallments: number | null;
  },
) {
  if (!row.recurrenceType) {
    return labels.transactionRepeats(TransactionRepeats.ONE_OFF);
  }

  const type = row.recurrenceType as RecurrenceType;

  if (type === RecurrenceType.FIXED) {
    return t("transaction.repeats.fixed", {
      count: row.recurrenceInstallments ?? 0,
    });
  }

  return row.recurrenceInterval && row.recurrenceInterval > 1
    ? t("transaction.repeats.withInterval", {
        type: labels.recurrenceType(type),
        interval: row.recurrenceInterval,
      })
    : labels.recurrenceType(type);
}
