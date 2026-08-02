import { type CategoryRow } from "@budget-manager/client";
import { useEnumLabels } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { useState } from "react";

import { RowCard } from "@/components/ui/row-card";
import { RowMenu } from "@/components/ui/row-menu";
import { CategoryLabel } from "@/modules/category/components/category-label";

import { ArchiveCategorySheet } from "../archive-category-sheet";
import { EditCategorySheet } from "../edit-category-sheet";

type RowSheet = "edit" | "archive" | null;

export function CategoryRowCard({ category }: { category: CategoryRow }) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const [sheet, setSheet] = useState<RowSheet>(null);

  return (
    <>
      <RowCard
        // The swatch rides in the name rather than owning a column of its own:
        // it is how a category reads everywhere else in the app.
        primary={
          <CategoryLabel
            color={category.color}
            name={category.name}
            variant="bodyMedium"
          />
        }
        actions={
          <RowMenu
            label={t("common.actionsFor", { name: category.name })}
            actions={[
              { label: t("common.edit"), onPress: () => setSheet("edit") },
              {
                label: t("common.archive"),
                destructive: true,
                onPress: () => setSheet("archive"),
              },
            ]}
          />
        }
        details={[{ label: t("common.type"), value: labels.categoryType(category.type) }]}
      />

      {sheet === "edit" && (
        <EditCategorySheet
          category={category}
          open
          onOpenChange={(next) => setSheet(next ? "edit" : null)}
        />
      )}
      {sheet === "archive" && (
        <ArchiveCategorySheet
          category={category}
          open
          onOpenChange={(next) => setSheet(next ? "archive" : null)}
        />
      )}
    </>
  );
}
