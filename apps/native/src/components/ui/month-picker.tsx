import { currentMonth, monthParts, toMonthKey } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { View } from "react-native";

import { Select } from "@/components/ui/select";
import { SPACING } from "@/theme/tokens";

/** How far either side of today a budget may be anchored. */
const YEARS_BACK = 2;
const YEARS_AHEAD = 5;

/**
 * A month, not a date. `DatePicker` would ask for a day the budget then throws
 * away, so this is two selects over the same `yyyy-MM` string every schema and
 * tRPC input already carries. The month names come from the app's locale, so the
 * control reads in the same language as the heading above it.
 */
export function MonthPicker({
  value,
  onValueChange,
  invalid,
}: {
  value: string;
  onValueChange: (value: string) => void;
  invalid?: boolean;
}) {
  const { t, formatMonthString } = useI18n();
  const { year, monthIndex } = monthParts(value || currentMonth());
  const thisYear = new Date().getFullYear();

  const monthItems = Array.from({ length: 12 }, (_, index) => ({
    label: formatMonthString(toMonthKey(2000, index), "monthShort"),
    value: `${index}`,
  }));

  // The window plus whatever year is actually selected. A budget anchored before
  // the window — an old series being edited — would otherwise hand the select a
  // value with no matching item, which is the same failure `toPreferredCurrency`
  // exists to prevent.
  const years = [
    ...new Set([
      ...Array.from(
        { length: YEARS_BACK + YEARS_AHEAD + 1 },
        (_, index) => thisYear - YEARS_BACK + index,
      ),
      year,
    ]),
  ].sort((a, b) => a - b);

  return (
    <View style={{ flexDirection: "row", gap: SPACING.sm }}>
      <Select
        label={t("budget.column.month")}
        items={monthItems}
        value={`${monthIndex}`}
        invalid={invalid}
        onValueChange={(next) => onValueChange(toMonthKey(year, Number(next)))}
        style={{ flex: 1 }}
      />
      <Select
        label={t("budget.field.startsOn")}
        items={years.map((candidate) => ({
          label: `${candidate}`,
          value: `${candidate}`,
        }))}
        value={`${year}`}
        invalid={invalid}
        onValueChange={(next) => onValueChange(toMonthKey(Number(next), monthIndex))}
        style={{ width: 116 }}
      />
    </View>
  );
}
