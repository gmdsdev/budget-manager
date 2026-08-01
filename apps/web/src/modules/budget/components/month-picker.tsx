import { useI18n } from "@budget-manager/i18n/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@budget-manager/ui/components/select";
import { currentMonth, monthParts, toMonthKey } from "../utils/month";

/** How far either side of today a budget may be anchored. */
const YEARS_BACK = 2;
const YEARS_AHEAD = 5;

/**
 * A month, not a date. `DatePicker` would ask for a day the budget then throws
 * away, so this is two selects over the same `yyyy-MM` string every schema and
 * tRPC input already carries. The month names come from the app's locale, so
 * the control reads in the same language as the heading above it.
 */
export function MonthPicker({
  id,
  name,
  value,
  onValueChange,
  onBlur,
  "aria-invalid": ariaInvalid,
}: {
  id: string;
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  "aria-invalid"?: true | undefined;
}) {
  const { formatMonthString, t } = useI18n();
  const { year, monthIndex } = monthParts(value || currentMonth());
  const thisYear = new Date().getFullYear();

  const monthItems = Array.from({ length: 12 }, (_, index) => ({
    label: formatMonthString(toMonthKey(2000, index), "monthShort"),
    value: `${index}`,
  }));

  const yearItems = Array.from(
    { length: YEARS_BACK + YEARS_AHEAD + 1 },
    (_, index) => {
      const candidate = thisYear - YEARS_BACK + index;

      return { label: `${candidate}`, value: `${candidate}` };
    },
  );

  return (
    <div className="flex flex-row gap-2">
      <Select<string>
        items={monthItems}
        id={id}
        name={name}
        value={`${monthIndex}`}
        onValueChange={(next) =>
          onValueChange(toMonthKey(year, Number(next ?? monthIndex)))
        }
      >
        <SelectTrigger
          aria-label={t("budget.column.month")}
          aria-invalid={ariaInvalid}
          className="flex-1"
          onBlur={onBlur}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {monthItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select<string>
        items={yearItems}
        id={`${id}-year`}
        value={`${year}`}
        onValueChange={(next) =>
          onValueChange(toMonthKey(Number(next ?? year), monthIndex))
        }
      >
        <SelectTrigger
          aria-label={t("budget.field.startsOn")}
          aria-invalid={ariaInvalid}
          className="w-28"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
