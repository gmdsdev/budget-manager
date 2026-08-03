import { DetailRow, DetailSheet } from "@/components/detail-sheet";
import type { CategoryRow } from "@budget-manager/client";
import { useEnumLabels } from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { Button } from "@budget-manager/ui/components/button";
import { useState } from "react";

import { ArchiveCategoryDialog } from "./archive-category-dialog";
import { CategoryLabel } from "./category-dot";
import { EditCategoryDialog } from "./edit-category-dialog";

type NestedDialog = "edit" | "archive" | null;

/**
 * What a category row opens. A category holds no figure of its own — it is a
 * label spending is read through — so the sheet leads with the swatch and name
 * rather than an amount.
 */
export function CategoryDetailDialog({
  category,
  onClose,
}: {
  category: CategoryRow;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const labels = useEnumLabels();
  const [dialog, setDialog] = useState<NestedDialog>(null);

  /** Dismissing a nested dialog ends the whole interaction, as the old row menu did. */
  function closeNested(next: boolean) {
    if (!next) onClose();
  }

  return (
    <>
      <DetailSheet
        open={dialog === null}
        onOpenChange={(next) => {
          if (!next && dialog === null) onClose();
        }}
        title={t("category.detail.title")}
        description={
          <CategoryLabel color={category.color} name={category.name} />
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog("edit")}>
              {t("common.edit")}
            </Button>
            <Button variant="destructive" onClick={() => setDialog("archive")}>
              {t("common.archive")}
            </Button>
          </>
        }
      >
        <DetailRow label={t("common.type")}>
          {labels.categoryType(category.type)}
        </DetailRow>
      </DetailSheet>

      {dialog === "edit" && (
        <EditCategoryDialog
          key={category.id}
          category={category}
          open
          onOpenChange={closeNested}
        />
      )}
      {dialog === "archive" && (
        <ArchiveCategoryDialog
          key={category.id}
          category={category}
          open
          onOpenChange={closeNested}
        />
      )}
    </>
  );
}
