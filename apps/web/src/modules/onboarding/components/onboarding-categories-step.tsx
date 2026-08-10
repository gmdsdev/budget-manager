import type { CategoryRow } from "@budget-manager/client";
import {
  useCategoriesQuery,
  useEnumLabels,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { useState } from "react";

import { CategoryLabel } from "@/modules/category/components/category-dot";
import { CreateCategoryDialog } from "@/modules/category/components/create-category-dialog";
import { EditCategoryDialog } from "@/modules/category/components/edit-category-dialog";

export function OnboardingCategoriesStep() {
  const t = useTranslate();
  const labels = useEnumLabels();
  const categoriesQuery = useCategoriesQuery();
  const categories = categoriesQuery.data?.rows ?? [];
  const [selected, setSelected] = useState<CategoryRow | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("onboarding.categories.empty")}
        </p>
      ) : (
        <ul className="grid gap-1 sm:grid-cols-2">
          {categories.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                aria-label={t("onboarding.categories.edit", {
                  name: category.name,
                })}
                onClick={() => setSelected(category)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
              >
                <CategoryLabel color={category.color} name={category.name} />
                <span className="shrink-0 text-sm text-muted-foreground">
                  {labels.categoryType(category.type)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <CreateCategoryDialog />
      </div>

      {selected && (
        <EditCategoryDialog
          key={selected.id}
          category={selected}
          open
          onOpenChange={(open) => {
            if (!open) {
              setSelected(null);
            }
          }}
        />
      )}
    </div>
  );
}
