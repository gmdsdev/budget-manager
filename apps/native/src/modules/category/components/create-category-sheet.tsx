import {
  useCategoryForm,
  useCreateCategoryMutation,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { CategoryType, DEFAULT_CATEGORY_COLOR } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { FormSheet } from "@/components/ui/form-sheet";
import { useResetOnOpen } from "@/hooks/use-reset-on-open";

import { CategoryFormFields } from "./category-form-fields";

export function CreateCategorySheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const createMutation = useCreateCategoryMutation();

  const form = useCategoryForm({
    defaultValues: {
      name: "",
      type: CategoryType.EXPENSE,
      color: DEFAULT_CATEGORY_COLOR,
    },
    onSubmit: async (values) => {
      await createMutation.mutateAsync(values);
      handleOpenChange(false);
    },
  });

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    form.reset();
  }

  useResetOnOpen(open, form.reset);

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={t("category.create.title")}
      description={t("category.create.description")}
      submitLabel={t("category.create.submit")}
      submittingLabel={t("common.creating")}
      isSubmitting={isSubmitting}
      onSubmit={() => void form.handleSubmit()}
    >
      <CategoryFormFields form={form} />
    </FormSheet>
  );
}
