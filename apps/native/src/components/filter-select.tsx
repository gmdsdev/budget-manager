import { FILTER_ALL } from "@budget-manager/schemas";

import { Select, type SelectItem } from "@/components/ui/select";

export type FilterItem = SelectItem;

/**
 * The trigger reads as the column name until the column is actually filtered,
 * which is what lets the bar drop its labels. The list keeps its explicit
 * "All …" row, so resetting one column stays a visible choice.
 */
export function FilterSelect({
  label,
  items,
  value,
  onValueChange,
  full,
}: {
  label: string;
  items: FilterItem[];
  value: string;
  onValueChange: (value: string) => void;
  /** A whole row, for a control whose values are long (an account name). */
  full?: boolean;
}) {
  const selected = value === FILTER_ALL ? undefined : value;

  return (
    <Select
      label={label}
      items={items}
      // Unset shows the column name through the placeholder rather than the
      // "All …" row's label, which is what keeps the bar readable at a glance.
      value={selected ?? ""}
      placeholder={label}
      onValueChange={(next) => onValueChange(next || FILTER_ALL)}
      style={full ? { width: "100%" } : { flexGrow: 1, flexBasis: 140 }}
    />
  );
}
