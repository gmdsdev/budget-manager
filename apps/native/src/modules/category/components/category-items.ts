import { TRANSACTION_CATEGORY_NONE } from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";
import type { CategoryColor } from "@budget-manager/schemas";

import type { SelectItem } from "@/components/ui/select";
import { useColors } from "@/theme/theme-provider";

type Option = { id: string; name: string; color: CategoryColor };

/**
 * The category rows every transaction-shaped form offers, with the uncategorized
 * sentinel first. Its swatch is `null` rather than absent — a row whose colour is
 * empty is not the same as a column that has none.
 *
 * A hook rather than a plain function, because a category's hue carries a light and
 * a dark step and the resolved colour has to come from the palette in force.
 */
export function useCategoryItems(categories: Option[] | undefined): SelectItem[] {
  const t = useTranslate();
  const colors = useColors();

  return [
    { label: t("category.uncategorized"), value: TRANSACTION_CATEGORY_NONE, color: null },
    ...(categories ?? []).map((category) => ({
      label: category.name,
      value: category.id,
      color: colors.category[category.color],
    })),
  ];
}
