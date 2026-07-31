import type { CategoryColor } from "@budget-manager/schemas";
import { cn } from "@budget-manager/ui/lib/utils";
import { categoryColorVar } from "../colors";

/**
 * Decoration, never the message: the swatch always sits next to the name, so it
 * is `aria-hidden` and adds no text of its own. Twelve hues cannot all stay
 * separable under dichromacy, which is exactly why the label never leaves.
 */
export function CategoryDot({
  color,
  className,
}: {
  color: CategoryColor | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2 shrink-0 rounded-none",
        color ? "border border-border" : "border border-muted-foreground/60",
        className,
      )}
      style={color ? { backgroundColor: categoryColorVar(color) } : undefined}
    />
  );
}

export function CategoryLabel({
  color,
  name,
  className,
}: {
  color: CategoryColor | null;
  name: string;
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <CategoryDot color={color} />
      <span className="truncate">{name}</span>
    </span>
  );
}

export type CategoryItem = {
  label: string;
  value: string;
  color: CategoryColor | null;
};

/**
 * Base UI resolves a bare `<SelectValue />` to the item's plain label, which
 * would leave the trigger as the one place a category shows up unswatched.
 */
export function CategoryItemLabel({
  items,
  value,
}: {
  items: CategoryItem[];
  value: string;
}) {
  const item = items.find((candidate) => candidate.value === value);

  if (!item) {
    return null;
  }

  return <CategoryLabel color={item.color} name={item.label} />;
}
