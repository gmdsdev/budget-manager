import { useTranslate } from "@budget-manager/i18n/react";
import { Button } from "@budget-manager/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@budget-manager/ui/components/dialog";
import { useId } from "react";
import { useCategoryForm } from "@budget-manager/client/react";
import { useUpdateCategoryMutation } from "@budget-manager/client/react";
import type { CategoryRow } from "@budget-manager/client";
import { CategoryFormFields } from "./category-form-fields";

export function EditCategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  category: CategoryRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslate();
  const formId = useId();
  const updateMutation = useUpdateCategoryMutation();

  const form = useCategoryForm({
    defaultValues: {
      name: category.name,
      type: category.type,
      color: category.color,
    },
    onSubmit: async (values) => {
      await updateMutation.mutateAsync({ ...values, id: category.id });
      handleOpenChange(false);
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      form.reset();
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("category.edit.title")}</DialogTitle>
          <DialogDescription>
            {t("category.edit.description", { name: category.name })}
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <CategoryFormFields form={form} />
        </form>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline">{t("common.cancel")}</Button>}
          />
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form={formId} disabled={isSubmitting}>
                {isSubmitting ? t("common.saving") : t("common.saveChanges")}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
