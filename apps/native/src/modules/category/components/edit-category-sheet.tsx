import type { CategoryRow } from "@budget-manager/client";
import {
  useCategoryForm,
  useUpdateCategoryMutation,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";

import { CategoryFormFields } from "./category-form-fields";

export function EditCategorySheet({
  category,
  open,
  onOpenChange,
}: {
  category: CategoryRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const updateMutation = useUpdateCategoryMutation();

  const form = useCategoryForm({
    defaultValues: {
      name: category.name,
      type: category.type,
      color: category.color,
    },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ ...values, id: category.id });
      onOpenChange(false);
    },
  });

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("category.edit.title")}
      description={t("category.edit.description", { name: category.name })}
      submitLabel={t("common.saveChanges")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <CategoryFormFields form={form} />
    </FormSheet>
  );
}
