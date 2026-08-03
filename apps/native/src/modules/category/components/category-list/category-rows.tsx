import type { CategoryRow } from "@budget-manager/client";
import { useEnumLabels } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";

import { RecordGlyph, RecordList, RecordRow } from "@/components/record-row";
import { categoryColor } from "@/modules/category/colors";
import { useColors } from "@/theme/theme-provider";

export function CategoryRows({
  categories,
  onSelect,
}: {
  categories: CategoryRow[];
  onSelect: (category: CategoryRow) => void;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const colors = useColors();

  return (
    <RecordList label={t("category.caption")}>
      {categories.map((category) => {
        const ink = categoryColor(colors, category.color);

        return (
          <RecordRow
            key={category.id}
            label={t("category.detail.open", { name: category.name })}
            onSelect={() => onSelect(category)}
            glyph={
              <RecordGlyph color={ink}>
                <Feather name="tag" size={20} color={ink} />
              </RecordGlyph>
            }
            primary={category.name}
            meta={[labels.categoryType(category.type)]}
          />
        );
      })}
    </RecordList>
  );
}
