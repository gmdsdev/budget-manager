import { FILTER_ALL } from "@budget-manager/schemas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@budget-manager/ui/components/select";

export type FilterItem = { label: string; value: string };

/**
 * The trigger reads as the column name until the column is actually filtered,
 * which is what lets the bar drop its labels. The popup keeps its explicit
 * "All …" row, so resetting one column stays a visible choice.
 */
export function FilterSelect({
  id,
  label,
  items,
  value,
  onValueChange,
}: {
  id: string;
  label: string;
  items: FilterItem[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  function display(selected: string) {
    if (selected === FILTER_ALL) {
      return label;
    }

    return items.find((item) => item.value === selected)?.label ?? label;
  }

  return (
    <Select<string>
      items={items}
      id={id}
      value={value}
      onValueChange={(next) => onValueChange(next as string)}
    >
      <SelectTrigger aria-label={label} className="min-w-32">
        <SelectValue>{(selected: string) => display(selected)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
