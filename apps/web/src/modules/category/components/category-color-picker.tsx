import { useEnumLabels } from "@/lib/enum-labels";
import { CATEGORY_COLORS, type CategoryColor } from "@budget-manager/schemas";
import { cn } from "@budget-manager/ui/lib/utils";
import { categoryColorVar } from "../colors";

/**
 * A grid of the palette rather than a `<Select>`: the choice *is* the colour, so
 * hiding the options behind a trigger would make the user open a popup to see
 * what they are picking between. Radios, because exactly one is chosen.
 */
export function CategoryColorPicker({
  id,
  value,
  onValueChange,
}: {
  id: string;
  value: CategoryColor;
  onValueChange: (color: CategoryColor) => void;
}) {
  const labels = useEnumLabels();

  return (
    <div id={id} role="radiogroup" className="flex flex-row flex-wrap gap-1.5">
      {CATEGORY_COLORS.map((color) => {
        const selected = color === value;
        const label = labels.categoryColor(color);

        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => onValueChange(color)}
            className={cn(
              "size-7 rounded-none border border-border outline-none transition-[box-shadow]",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              // Selection reads as a ring against the page rather than as a
              // change of tint, so it holds up on every hue in the palette.
              selected &&
                "ring-2 ring-foreground ring-offset-2 ring-offset-background",
            )}
            style={{ backgroundColor: categoryColorVar(color) }}
          />
        );
      })}
    </div>
  );
}
