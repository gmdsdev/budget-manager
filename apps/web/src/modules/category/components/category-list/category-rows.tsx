import { RecordGlyph, RecordList, RecordRow } from "@/components/record-row";
import { categoryColorVar } from "@/modules/category/colors";
import type { CategoryRow } from "@budget-manager/client";
import { useEnumLabels } from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { TagIcon } from "@phosphor-icons/react";

export function CategoryRows({
  categories,
  onSelect,
}: {
  categories: CategoryRow[];
  onSelect: (category: CategoryRow) => void;
}) {
  const { t } = useI18n();
  const labels = useEnumLabels();

  return (
    <RecordList label={t("category.caption")}>
      {categories.map((category) => (
        <RecordRow
          key={category.id}
          label={t("category.detail.open", { name: category.name })}
          onSelect={() => onSelect(category)}
          glyph={
            <RecordGlyph color={categoryColorVar(category.color)}>
              <TagIcon className="size-5" />
            </RecordGlyph>
          }
          primary={category.name}
          meta={[labels.categoryType(category.type)]}
        />
      ))}
    </RecordList>
  );
}
