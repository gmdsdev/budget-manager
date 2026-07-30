import { FILTER_ALL } from "@budget-manager/schemas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@budget-manager/ui/components/select";

/**
 * `color` is a CSS colour rather than a palette name, so the bar stays
 * domain-free. Three states, not two: absent means the column has no swatch at
 * all, `null` means this row's swatch is empty — an uncategorized transaction
 * has no colour to show, which is not the same as a wallet never having one.
 */
export type FilterItem = {
  label: string;
  value: string;
  color?: string | null;
};

function Swatch({ color }: { color: string | null }) {
  return (
    <span
      aria-hidden
      className={`size-2 shrink-0 rounded-full ${
        color ? "" : "border border-muted-foreground/60"
      }`}
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}

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
  // One row carrying a swatch means every row reserves the space, so the labels
  // stay on one left edge.
  const swatched = items.some((item) => item.color !== undefined);

  function selected(value: string) {
    return value === FILTER_ALL
      ? undefined
      : items.find((item) => item.value === value);
  }

  return (
    <Select<string>
      items={items}
      id={id}
      value={value}
      onValueChange={(next) => onValueChange(next as string)}
    >
      <SelectTrigger aria-label={label} className="w-full sm:w-auto sm:min-w-32">
        <SelectValue>
          {(value: string) => {
            const item = selected(value);

            return (
              <>
                {item && item.color !== undefined && (
                  <Swatch color={item.color} />
                )}
                {item?.label ?? label}
              </>
            );
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {swatched &&
              (item.color === undefined ? (
                <span aria-hidden className="size-2 shrink-0" />
              ) : (
                <Swatch color={item.color} />
              ))}
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
