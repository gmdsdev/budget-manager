import type { CategoryRow } from "@budget-manager/client";
import { useEnumLabels } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { useState } from "react";

import { DetailRow, DetailSheet } from "@/components/detail-sheet";
import { Button } from "@/components/ui/button";

import { ArchiveCategorySheet } from "./archive-category-sheet";
import { EditCategorySheet } from "./edit-category-sheet";

type NestedSheet = "edit" | "archive" | null;

/**
 * What a category row opens. A category holds no figure of its own — it is a label
 * spending is read through — so the sheet leads with its name rather than an amount.
 */
export function CategoryDetailSheet({
  category,
  onClose,
}: {
  category: CategoryRow;
  onClose: () => void;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const [sheet, setSheet] = useState<NestedSheet>(null);

  /** Dismissing a nested sheet ends the whole interaction, as the row menu did. */
  function closeNested(next: boolean) {
    if (!next) onClose();
  }

  return (
    <>
      <DetailSheet
        open={sheet === null}
        onOpenChange={(next) => {
          if (!next && sheet === null) onClose();
        }}
        title={t("category.detail.title")}
        description={category.name}
        actions={
          <>
            <Button
              variant="outline"
              label={t("common.edit")}
              onPress={() => setSheet("edit")}
            />
            <Button
              variant="destructive"
              label={t("common.archive")}
              onPress={() => setSheet("archive")}
            />
          </>
        }
      >
        <DetailRow label={t("common.type")}>
          {labels.categoryType(category.type)}
        </DetailRow>
      </DetailSheet>

      {sheet === "edit" && (
        <EditCategorySheet
          key={category.id}
          category={category}
          open
          onOpenChange={closeNested}
        />
      )}
      {sheet === "archive" && (
        <ArchiveCategorySheet
          key={category.id}
          category={category}
          open
          onOpenChange={closeNested}
        />
      )}
    </>
  );
}
